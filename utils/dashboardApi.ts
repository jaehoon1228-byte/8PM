// =====================================================================
// [CSR 전용] 메인(대시보드) 화면 클라이언트 API
//  - 백엔드(MES-AI-ChatBot-Web-BackEnd) 컨트롤러 규격과 1:1 일치
//  - utils/api.ts 의 ky 인스턴스(토큰 자동 첨부 / 401 재발급 인터셉터)를 재사용
// =====================================================================
import { isHTTPError } from "ky";
import { api, clearCachedAccessToken } from "@/utils/api";
import { clearRefreshToken, getRefreshToken } from "@/utils/createHttpOnlyCookie";
import type {
    AskResponseDto,
    ChatHistoryDto,
    ChatSession,
    ChatSessionRequestDto,
    ChatSessionResponseDto,
    FileDeleteResponseDto,
    FileMetadataDto,
    FileUploadResponseDto,
    JoinRequestDto,
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
            const rawText = await error.response.clone().text();
            if (rawText) {
                try {
                    const body = JSON.parse(rawText) as {
                        message?: string;
                        error?: string;
                    };
                    if (body.message) return body.message;
                    if (body.error) return body.error;
                } catch {
                    return rawText;
                }
            }
        } catch {
            // 기본 메시지 사용
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

export const FILE_STORAGE_KEYS = {
    personal: (empId: number) => `mes_uploaded_files_${empId}`,
    shared: (companyId: number) => `mes_shared_files_${companyId}`,
} as const;

export function getStoredSharedFiles(companyId: number): UploadedFile[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(FILE_STORAGE_KEYS.shared(companyId));
        if (!raw) return [];
        return JSON.parse(raw) as UploadedFile[];
    } catch {
        return [];
    }
}

export function setStoredSharedFiles(
    companyId: number,
    files: UploadedFile[],
): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(
            FILE_STORAGE_KEYS.shared(companyId),
            JSON.stringify(files),
        );
    } catch {
        // 스토리지 제한 무시
    }
}

export function getStoredPersonalFiles(employeeId: number): UploadedFile[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(FILE_STORAGE_KEYS.personal(employeeId));
        if (!raw) return [];
        return JSON.parse(raw) as UploadedFile[];
    } catch {
        return [];
    }
}

export function setStoredPersonalFiles(
    employeeId: number,
    files: UploadedFile[],
): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(
            FILE_STORAGE_KEYS.personal(employeeId),
            JSON.stringify(files),
        );
    } catch {
        // 스토리지 제한 무시
    }
}

/**
 * 메인 페이지용 개인 파일 목록 조회 (GET /api/v1/files)
 *  - 중간관리자가 업로드한 공용데이터 파일(shared = true)은 메인페이지에서 보이지 않도록 제외
 */
export async function fetchPersonalFiles(
    employeeId: number,
    companyId: number,
): Promise<UploadedFile[]> {
    const sharedIds = new Set(
        getStoredSharedFiles(companyId).map((f) => f.id),
    );
    const response = await api
        .get(ENDPOINTS.files)
        .json<FileMetadataDto[]>();

    return response
        .map((dto) => toUploadedFile(dto))
        .filter(
            (file) =>
                !file.shared &&
                !sharedIds.has(file.id) &&
                (file.employeeId === undefined ||
                    file.employeeId === employeeId),
        );
}

/**
 * FileController: POST /api/v1/files?shared=true|false
 *  - 백엔드는 @RequestPart("file") 과 @RequestParam boolean shared 를 받음
 *  - 문서 파싱(PDF/DOCX/XLSX/PPTX/CSV) + OCR/청킹이 동기로 수행되므로 타임아웃을 넉넉히 설정
 */
export async function uploadSingleFile(
    file: File,
    shared = false,
    targetEmployeeId?: number,
    targetCompanyId?: number,
): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append("file", file);

    const searchParams: Record<string, string> = {
        shared: String(shared),
    };
    if (targetEmployeeId !== undefined) {
        searchParams.targetEmployeeId = String(targetEmployeeId);
    }
    if (targetCompanyId !== undefined) {
        searchParams.targetCompanyId = String(targetCompanyId);
    }

    const response = await api
        .post(ENDPOINTS.uploadFile, {
            searchParams,
            body: formData,
            timeout: 180_000,
        })
        .json<FileUploadResponseDto>();

    if (!response.fileData) {
        throw new Error(response.message || "파일 업로드에 실패했습니다.");
    }
    const converted = toUploadedFile(response.fileData, file.size);
    return {
        ...converted,
        shared,
        employeeId: targetEmployeeId ?? converted.employeeId,
        companyId: targetCompanyId ?? converted.companyId,
    };
}

export async function uploadFiles(
    files: File[],
    shared = false,
    targetEmployeeId?: number,
    targetCompanyId?: number,
): Promise<{
    uploaded: UploadedFile[];
    failed: { name: string; reason: string }[];
}> {
    const uploaded: UploadedFile[] = [];
    const failed: { name: string; reason: string }[] = [];

    for (const file of files) {
        try {
            const item = await uploadSingleFile(
                file,
                shared,
                targetEmployeeId,
                targetCompanyId,
            );
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
 * FileController: DELETE /api/v1/files/{fileId}
 *  - USER 는 본인 파일만, MANAGER 는 MASTER 외 파일만 삭제 가능 (위반 시 403 + message 반환)
 */
export async function deleteFile(fileId: string): Promise<FileDeleteResponseDto> {
    return api.delete(ENDPOINTS.deleteFile(fileId)).json<FileDeleteResponseDto>();
}

// =====================================================================
// [관리자 콘솔 전용 API] UserController & FileController 연동
// =====================================================================

/** UserController: GET /api/v1/users (본인 회사 유저 목록 조회) */
export async function fetchAdminUsers(): Promise<UserInfo[]> {
    return api.get(ENDPOINTS.users).json<UserInfo[]>();
}

/** UserController: POST /api/v1/users (하위관리자 계정 생성) */
export async function createAdminUser(dto: JoinRequestDto): Promise<string> {
    return api.post(ENDPOINTS.users, { json: dto }).text();
}

/** UserController: DELETE /api/v1/users/{target} (유저 삭제) */
export async function deleteAdminUser(targetEmployeeId: number): Promise<string> {
    const res = await api.delete(ENDPOINTS.deleteUser(targetEmployeeId)).text();
    if (typeof window !== "undefined") {
        localStorage.removeItem(FILE_STORAGE_KEYS.personal(targetEmployeeId));
    }
    return res;
}

/** FileController: 관리자페이지 공용 데이터 파일 목록 조회 */
export async function fetchCompanySharedFiles(
    companyId: number,
): Promise<UploadedFile[]> {
    const stored = getStoredSharedFiles(companyId);
    const storedIds = new Set(stored.map((f) => f.id));

    try {
        const response = await api
            .get(ENDPOINTS.files, {
                searchParams: {
                    shared: "true",
                    companyId: String(companyId),
                },
            })
            .json<FileMetadataDto[]>();

        const fromApi = response
            .map((dto) => toUploadedFile(dto))
            .filter(
                (f) =>
                    (f.companyId === undefined || f.companyId === companyId) &&
                    (f.shared !== false || storedIds.has(f.id)),
            )
            .map((f) => ({ ...f, shared: true, companyId }));

        const mergedMap = new Map<string, UploadedFile>();
        for (const item of fromApi) {
            mergedMap.set(item.id, item);
        }
        for (const item of stored) {
            if (!mergedMap.has(item.id)) {
                mergedMap.set(item.id, item);
            }
        }
        const merged = Array.from(mergedMap.values());
        setStoredSharedFiles(companyId, merged);
        return merged;
    } catch {
        return stored;
    }
}

/** FileController: 관리자페이지 특정 사원의 개별 업로드 파일 목록 조회 */
export async function fetchUserPersonalFilesForAdmin(
    employeeId: number,
    companyId: number,
): Promise<UploadedFile[]> {
    const sharedIds = new Set(
        getStoredSharedFiles(companyId).map((f) => f.id),
    );
    const stored = getStoredPersonalFiles(employeeId).filter(
        (f) => !f.shared && !sharedIds.has(f.id),
    );

    try {
        const response = await api
            .get(ENDPOINTS.files, {
                searchParams: {
                    employeeId: String(employeeId),
                    companyId: String(companyId),
                },
            })
            .json<FileMetadataDto[]>();

        const fromApi = response
            .map((dto) => toUploadedFile(dto))
            .filter(
                (f) =>
                    !f.shared &&
                    !sharedIds.has(f.id) &&
                    (f.companyId === undefined || f.companyId === companyId) &&
                    (f.employeeId === undefined || f.employeeId === employeeId),
            );

        const mergedMap = new Map<string, UploadedFile>();
        for (const item of fromApi) {
            mergedMap.set(item.id, item);
        }
        for (const item of stored) {
            if (!mergedMap.has(item.id)) {
                mergedMap.set(item.id, item);
            }
        }
        const merged = Array.from(mergedMap.values());
        setStoredPersonalFiles(employeeId, merged);
        return merged;
    } catch {
        return stored;
    }
}

/**
 * FileController: 사내 전체 사원별 개별 파일 목록을 단일 요청(O(1))으로 일괄 조회 (N+1 쿼리 방지)
 */
export async function fetchAllCompanyFilesByEmployeeMap(
    companyId: number,
    employeeIds: number[],
): Promise<Record<number, UploadedFile[]>> {
    const sharedIds = new Set(
        getStoredSharedFiles(companyId).map((f) => f.id),
    );
    const resultMap: Record<number, UploadedFile[]> = {};
    for (const empId of employeeIds) {
        resultMap[empId] = getStoredPersonalFiles(empId).filter(
            (f) => !f.shared && !sharedIds.has(f.id),
        );
    }

    try {
        const response = await api
            .get(ENDPOINTS.files, {
                searchParams: {
                    allCompany: "true",
                    companyId: String(companyId),
                },
            })
            .json<FileMetadataDto[]>();

        const grouped = new Map<number, Map<string, UploadedFile>>();
        for (const empId of employeeIds) {
            grouped.set(empId, new Map());
        }

        for (const dto of response) {
            const file = toUploadedFile(dto);
            if (file.shared || sharedIds.has(file.id) || !file.employeeId) {
                continue;
            }
            const empMap = grouped.get(file.employeeId);
            if (empMap) {
                empMap.set(file.id, file);
            }
        }

        for (const empId of employeeIds) {
            const empMap = grouped.get(empId) ?? new Map<string, UploadedFile>();
            for (const localItem of resultMap[empId] ?? []) {
                if (!empMap.has(localItem.id)) {
                    empMap.set(localItem.id, localItem);
                }
            }
            const merged = Array.from(empMap.values());
            resultMap[empId] = merged;
            setStoredPersonalFiles(empId, merged);
        }

        return resultMap;
    } catch {
        return resultMap;
    }
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
        clearCachedAccessToken();
        await clearRefreshToken();
    }
}
