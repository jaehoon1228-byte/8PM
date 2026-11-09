// =====================================================================
// [CSR 전용] 메인(대시보드) 화면 클라이언트 API
//  - 백엔드(MES-AI-ChatBot-Web-BackEnd) 컨트롤러 규격과 1:1 일치
//  - utils/api.ts 의 ky 인스턴스(토큰 자동 첨부 / 401 재발급 인터셉터)를 재사용
// =====================================================================
import { isHTTPError } from "ky";
import { api, clearCachedAccessToken } from "@/utils/api";
import { clearRefreshToken, getRefreshToken } from "@/utils/createHttpOnlyCookie";
import { resetStores } from "@/utils/store/resetStores";
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
    toUserInfo,
} from "@/utils/endpoints";
import { useFileStore } from "@/utils/store/fileStore";

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
    return toUserInfo(
        await api
            .get(ENDPOINTS.me)
            .json<Omit<UserInfo, "createdAt"> & { createdAt?: string }>(),
    );
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

/** 회사 공용 파일 메타데이터 로컬 조회 (companyId 기준) */
export function getStoredSharedFiles(companyId: number): UploadedFile[] {
    return useFileStore.getState().sharedFiles[companyId] ?? [];
}

/** 회사 공용 파일 메타데이터 로컬 저장 (companyId 기준) */
export function setStoredSharedFiles(
    companyId: number,
    files: UploadedFile[],
): void {
    try {
        useFileStore.getState().setSharedFiles(companyId, files);
    } catch {
        // 스토리지 제한 무시
    }
}

/** 사원 개별 파일 메타데이터 로컬 조회 (employeeId 기준) */
export function getStoredPersonalFiles(employeeId: number): UploadedFile[] {
    return useFileStore.getState().personalFiles[employeeId] ?? [];
}

/** 사원 개별 파일 메타데이터 로컬 저장 (employeeId 기준) */
export function setStoredPersonalFiles(
    employeeId: number,
    files: UploadedFile[],
): void {
    try {
        useFileStore.getState().setPersonalFiles(employeeId, files);
    } catch {
        // 스토리지 제한 무시
    }
}

/** 사원 개별 파일 메타데이터 로컬 삭제 (employeeId 기준) */
export function removeStoredPersonalFiles(employeeId: number): void {
    useFileStore.getState().removePersonalFiles(employeeId);
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

/**
 * 여러 파일을 순차적으로 업로드합니다. 파일 하나가 실패해도 나머지는 계속 업로드합니다.
 * @param files 업로드할 파일 목록
 * @param shared true 이면 회사 공용 파일로, false 이면 개인 파일로 업로드합니다
 * @param targetEmployeeId 개인 파일을 올릴 대상 사원 ID (관리자가 사원 대신 업로드할 때)
 * @param targetCompanyId 업로드 대상 회사일련번호 (최고관리자가 회사를 선택했을 때)
 * @returns 성공한 파일 목록(`uploaded`)과 실패한 파일의 이름 및 사유(`failed`)
 */
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
    const response = await api
        .get(ENDPOINTS.users)
        .json<(Omit<UserInfo, "createdAt"> & { createdAt?: string })[]>();
    return response.map(toUserInfo);
}

/** UserController: POST /api/v1/users (하위관리자 계정 생성) */
export async function createAdminUser(dto: JoinRequestDto): Promise<string> {
    return api.post(ENDPOINTS.users, { json: dto }).text();
}

/** UserController: DELETE /api/v1/users/{target} (유저 삭제) */
export async function deleteAdminUser(targetEmployeeId: number): Promise<string> {
    const res = await api.delete(ENDPOINTS.deleteUser(targetEmployeeId)).text();
    removeStoredPersonalFiles(targetEmployeeId);
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
        resetStores();
    }
}
