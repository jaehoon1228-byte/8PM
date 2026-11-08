// =====================================================================
// 백엔드(MES-AI-ChatBot-Web-BackEnd) 실제 API 엔드포인트 & DTO → UI 변환기
//  - 서버(serverApi.ts) / 클라이언트(dashboardApi.ts) 양쪽에서 공용으로 사용
// =====================================================================
import type {
    AskResponseDto,
    ChatHistoryDto,
    ChatSession,
    ChatSessionResponseDto,
    FileMetadataDto,
    Message,
    UploadedFile,
    UserInfo,
} from "@/types/dashboard";
import { parseOptionalDateTime } from "@/utils/time";

export const BACKEND_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8080";

export const ENDPOINTS = {
    // JWTController (@RequestMapping("/api/v1"))
    refresh: "/api/v1/jwt/refresh",
    // CustomLogoutFilter
    logout: "/api/v1/logout",
    // UserController (@RequestMapping("/api/v1/users"))
    me: "/api/v1/users/me",
    users: "/api/v1/users", // GET: 관리자용 사용자 목록 조회, POST: 계정 생성
    deleteUser: (targetEmployeeId: number) =>
        `/api/v1/users/${encodeURIComponent(String(targetEmployeeId))}`, // DELETE: 사용자 삭제
    updateUserRole: (targetEmployeeId: number) =>
        `/api/v1/users/${encodeURIComponent(String(targetEmployeeId))}`, // PATCH: 권한 수정
    // ChatController (@RequestMapping("/api/v1/chat")) & spec.yaml
    chatSessions: "/api/v1/chat/sessions", // GET: 이전 대화방 목록 조회 (spec.yaml 정의)
    createSession: "/api/v1/chat/sessionrooms", // POST: 새 대화방 생성
    deleteSession: (sessionId: string) =>
        `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}`, // DELETE: 대화방 삭제
    chatHistories: (sessionId: string) =>
        `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/histories`, // GET: 대화 내역 조회
    askToLlm: (sessionId: string) =>
        `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/ask`, // POST: LLM 질문
    // FileController (@RequestMapping("/api/v1/files"))
    files: "/api/v1/files",
    uploadFile: "/api/v1/files", // POST: multipart/form-data (@RequestPart("file"))
    deleteFile: (fileId: string) =>
        `/api/v1/files/${encodeURIComponent(fileId)}`, // DELETE: 파일 삭제
} as const;

/** 메시지/파일 표시용 시각 (HH:mm). 값이 없거나 잘못되면 현재 시각 */
export function formatTime(dateInput?: Temporal.PlainDateTime | string): string {
    const dateTime =
        typeof dateInput === "string"
            ? parseOptionalDateTime(dateInput)
            : dateInput;
    return (dateTime ?? Temporal.Now.plainDateTimeISO()).toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatFileSize(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** UserController 응답(JSON 원형) → UI 사용자 정보 */
export const toUserInfo = (
    dto: Omit<UserInfo, "createdAt"> & { createdAt?: string },
): UserInfo => ({
    ...dto,
    createdAt: parseOptionalDateTime(dto.createdAt),
});

/** 서버 → 클라이언트 props 전달용 직렬화 (PlainDateTime → ISO 문자열) */
export const serializeUploadedFile = (
    file: UploadedFile,
): Omit<UploadedFile, "uploadedAt"> & { uploadedAt?: string } => ({
    ...file,
    uploadedAt: file.uploadedAt?.toString(),
});

/** 클라이언트에서 props 복원 (ISO 문자열 → PlainDateTime) */
export const reviveUploadedFile = (
    file: Omit<UploadedFile, "uploadedAt"> & { uploadedAt?: string },
): UploadedFile => ({
    ...file,
    uploadedAt: parseOptionalDateTime(file.uploadedAt),
});

/** 서버에서 받은 사원별 파일 맵 복원 (key: employeeId) */
export const reviveUploadedFileMap = (
    map: Record<number, (Omit<UploadedFile, "uploadedAt"> & { uploadedAt?: string })[]>,
): Record<number, UploadedFile[]> => {
    const result: Record<number, UploadedFile[]> = {};
    for (const key of Object.keys(map)) {
        const id = Number(key);
        result[id] = map[id].map(reviveUploadedFile);
    }
    return result;
};

export const toChatSession = (dto: ChatSessionResponseDto): ChatSession => ({
    id: dto.sessionId,
    title: dto.sessionTitle,
    messages: [],
    isLoaded: false,
});

export const toMessageFromHistory = (dto: ChatHistoryDto): Message => ({
    id: dto.chatId || dto.id || `${dto.recordedAt}-${dto.role}`,
    text: dto.message,
    sender: dto.role === "user" ? "user" : "bot",
    timestamp: formatTime(dto.recordedAt),
});

export const toMessageFromAsk = (dto: AskResponseDto): Message => ({
    id: dto.chatId || `${dto.recordedAt}-assistant`,
    text: dto.message,
    sender: dto.role === "user" ? "user" : "bot",
    timestamp: formatTime(dto.recordedAt),
});

export const toUploadedFile = (
    dto: FileMetadataDto,
    clientByteSize?: number,
): UploadedFile => {
    const resolvedEmployeeId =
        typeof dto.employeeId === "number"
            ? dto.employeeId
            : dto.employeeId?.employeeId;
    const resolvedCompanyId =
        typeof dto.companyId === "number"
            ? dto.companyId
            : typeof dto.employeeId === "object"
              ? dto.employeeId?.companyId?.companyId
              : undefined;

    return {
        id: dto.fileId,
        name: dto.originName,
        size:
            clientByteSize !== undefined
                ? formatFileSize(clientByteSize)
                : dto.fileType
                  ? dto.fileType.toUpperCase()
                  : "",
        uploadedAt: parseOptionalDateTime(dto.uploadedAt),
        employeeId: resolvedEmployeeId,
        companyId: resolvedCompanyId,
        shared: dto.shared,
    };
};
