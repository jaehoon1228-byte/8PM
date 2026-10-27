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
} from "@/types/dashboard";

export const BACKEND_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8080";

export const ENDPOINTS = {
    // JWTController (@RequestMapping("/api/v1"))
    refresh: "/api/v1/jwt/refresh",
    // CustomLogoutFilter
    logout: "/api/v1/logout",
    // UserController (@RequestMapping("/api/v1/users"))
    me: "/api/v1/users/me",
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
    uploadFile: "/api/v1/files/upload", // POST: multipart/form-data (@RequestPart("file"))
    deleteFile: (fileId: string) =>
        `/api/v1/files/delete/${encodeURIComponent(fileId)}`, // DELETE: 파일 삭제
} as const;

export function formatTime(dateInput: Date | string | undefined): string {
    const date = dateInput ? new Date(dateInput) : new Date();
    if (Number.isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatFileSize(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

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
): UploadedFile => ({
    id: dto.fileId,
    name: dto.originName,
    size:
        clientByteSize !== undefined
            ? formatFileSize(clientByteSize)
            : dto.fileType
              ? dto.fileType.toUpperCase()
              : "",
});
