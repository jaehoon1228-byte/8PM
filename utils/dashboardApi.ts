// =====================================================================
// [CSR 전용] 메인(대시보드) 화면 클라이언트 API
//  - 백엔드(MES-AI-ChatBot-Web-BackEnd) 컨트롤러 규격과 1:1 일치
//  - utils/api.ts 의 ky 인스턴스(토큰 자동 첨부 / 401 재발급 인터셉터)를 재사용
// =====================================================================
import { isHTTPError } from "ky";
import { api } from "@/utils/api";
import { clearRefreshToken, getRefreshToken } from "@/utils/createHttpOnlyCookie";
import type {
    AskResponseDto,
    ChatHistoryDto,
    ChatSession,
    ChatSessionRequestDto,
    ChatSessionResponseDto,
    FileDeleteResponseDto,
    FileUploadResponseDto,
    Message,
    UploadedFile,
    UserInfo,
    UserQuestionDto,
} from "@/types/dashboard";
import {
    ENDPOINTS,
    toChatSession,
    toMessageFromAsk,
    toMessageFromHistory,
    toUploadedFile,
} from "@/utils/endpoints";

/** 인터셉터의 재발급까지 실패한 경우(=세션 완전 만료)인지 판별 */
export function isSessionExpired(error: unknown): boolean {
    return isHTTPError(error) && error.response.status === 401;
}

/** 백엔드 에러 응답 본문에서 사용자에게 보여줄 메시지를 추출 */
export async function extractErrorMessage(
    error: unknown,
    fallback: string,
): Promise<string> {
    if (isHTTPError(error)) {
        try {
            const body = (await error.response.clone().json()) as {
                message?: string;
                error?: string;
            };
            if (body.message) return body.message;
            if (body.error) return body.error;
        } catch {
            // JSON 이 아닌 응답은 기본 메시지 사용
        }
    }
    return fallback;
}

/** UserController: GET /api/v1/users/me */
export async function fetchMyInfo(): Promise<UserInfo> {
    return api.get(ENDPOINTS.me).json<UserInfo>();
}

/**
 * 이전 대화방 목록 조회 (spec.yaml: GET /api/v1/chat/sessions)
 *  - 백엔드에 아직 미구현된 경우(404/405)에는 에러 대신 빈 배열을 반환
 */
export async function fetchChatSessions(): Promise<ChatSession[]> {
    try {
        const response = await api
            .get(ENDPOINTS.chatSessions)
            .json<ChatSessionResponseDto[]>();
        return response.map(toChatSession);
    } catch (error) {
        if (
            isHTTPError(error) &&
            (error.response.status === 404 || error.response.status === 405)
        ) {
            return [];
        }
        throw error;
    }
}

/**
 * ChatController: POST /api/v1/chat/sessionrooms
 *  - 새 대화방을 생성하고 sessionId(UUID)와 제목을 반환
 */
export async function createChatSession(title: string | null): Promise<ChatSession> {
    const body: ChatSessionRequestDto = { title };
    const response = await api
        .post(ENDPOINTS.createSession, { json: body })
        .json<ChatSessionResponseDto>();
    return { ...toChatSession(response), isLoaded: true };
}

/**
 * 대화방 삭제 (DELETE /api/v1/chat/sessions/{sessionId})
 *  - 백엔드에 아직 미구현된 경우(404/405)에도 클라이언트 목록/스토리지에서 안전하게 삭제되도록 처리
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
    if (sessionId.startsWith("temp-")) return;
    try {
        await api.delete(ENDPOINTS.deleteSession(sessionId));
    } catch (error) {
        if (
            isHTTPError(error) &&
            error.response.status === 404
        ) {
            return;
        }
        throw error;
    }
}

/**
 * ChatController: GET /api/v1/chat/sessions/{sessionId}/histories
 *  - 특정 대화방의 과거 대화 내역 전체 조회 (recordedAt 오름차순)
 */
export async function fetchChatHistories(sessionId: string): Promise<Message[]> {
    const response = await api
        .get(ENDPOINTS.chatHistories(sessionId))
        .json<ChatHistoryDto[]>();
    return response.map(toMessageFromHistory);
}

/**
 * ChatController: POST /api/v1/chat/sessions/{sessionId}/ask
 *  - 대화방에 질문을 전송하고 LLM 답변(AskResponseDto)을 반환
 */
export async function askToLlm(sessionId: string, question: string): Promise<Message> {
    const body: UserQuestionDto = { message: question };
    const response = await api
        .post(ENDPOINTS.askToLlm(sessionId), {
            json: body,
            timeout: 120_000, // RAG 검색 + LLM 답변 생성 대기 시간 확보
        })
        .json<AskResponseDto>();
    return toMessageFromAsk(response);
}

/**
 * FileController: POST /api/v1/files/upload
 *  - 백엔드는 @RequestPart("file") 단일 파일을 받으므로, 여러 파일 선택 시 순차 업로드
 *  - 문서 파싱(PDF/DOCX/XLSX/PPTX/CSV) + OCR/청킹이 동기로 수행되므로 타임아웃을 넉넉히 설정
 */
export async function uploadSingleFile(file: File): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api
        .post(ENDPOINTS.uploadFile, {
            body: formData,
            timeout: 180_000,
        })
        .json<FileUploadResponseDto>();

    if (!response.fileData) {
        throw new Error(response.message || "파일 업로드에 실패했습니다.");
    }
    return toUploadedFile(response.fileData, file.size);
}

export async function uploadFiles(
    files: File[],
): Promise<{ uploaded: UploadedFile[]; failed: { name: string; reason: string }[] }> {
    const uploaded: UploadedFile[] = [];
    const failed: { name: string; reason: string }[] = [];

    for (const file of files) {
        try {
            const item = await uploadSingleFile(file);
            uploaded.push(item);
        } catch (error) {
            if (isSessionExpired(error)) throw error;
            const reason = await extractErrorMessage(
                error,
                "파일 형식이 올바르지 않거나 업로드에 실패했습니다.",
            );
            failed.push({ name: file.name, reason });
        }
    }
    return { uploaded, failed };
}

/**
 * FileController: DELETE /api/v1/files/delete/{fileId}
 *  - USER 는 본인 파일만, MANAGER 는 MASTER 외 파일만 삭제 가능 (위반 시 403 + message 반환)
 */
export async function deleteFile(fileId: string): Promise<FileDeleteResponseDto> {
    return api.delete(ENDPOINTS.deleteFile(fileId)).json<FileDeleteResponseDto>();
}

/**
 * CustomLogoutFilter: POST /api/v1/logout
 *  - 백엔드 필터는 JSON Body 의 { refreshToken } 을 읽어 Redis 에서 삭제함
 */
export async function logout(): Promise<void> {
    try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            await api.post(ENDPOINTS.logout, {
                json: { refreshToken },
                throwHttpErrors: false,
            });
        }
    } finally {
        await clearRefreshToken();
    }
}
