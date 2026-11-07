// =====================================================================
// 메인(대시보드) 화면에서 사용하는 타입 정의
//  - 백엔드(MES-AI-ChatBot-Web-BackEnd) 실제 DTO / Entity 와 1:1 매핑
// =====================================================================

// ---------------------------- UI 타입 ----------------------------------
export interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: string;
}

export interface ChatSession {
    id: string; // 백엔드 sessionId (UUID 문자열)
    title: string;
    messages: Message[];
    /** 서버에서 과거 대화 내역(/histories)을 이미 불러왔는지 여부 */
    isLoaded?: boolean;
}

export type UserRole = "ROLE_MASTER" | "ROLE_MANAGER" | "ROLE_USER";

/** UserController GET /api/v1/users/me → UserInfoResponseDTO */
export interface UserInfo {
    companyId: number;
    companyName?: string;
    employeeId: number;
    username: string;
    email: string;
    role: UserRole | string;
    createdAt?: string;
}

export interface UploadedFile {
    id: string; // 백엔드 fileId (UUID 문자열)
    name: string;
    size: string;
    uploadedAt?: string;
    employeeId?: number;
    companyId?: number;
    shared?: boolean;
}

/** 서버(SSR)에서 미리 받아온 초기 데이터. null 이면 SSR 실패 → 클라이언트(CSR)에서 다시 요청 */
export interface DashboardInitialData {
    userInfo: UserInfo | null;
    chatSessions: ChatSession[] | null;
    files: UploadedFile[] | null;
}

/** 관리자 화면(/admin) 서버(SSR)에서 병렬로 미리 받아온 초기 데이터 */
export interface AdminInitialData {
    userInfo: UserInfo | null;
    companyUsers: UserInfo[] | null;
    sharedFiles: UploadedFile[] | null;
    userFilesMap: Record<number, UploadedFile[]> | null;
}

// --------------------- 백엔드 DTO / Entity 타입 ------------------------
/** ChatController POST /api/v1/chat/sessionrooms 요청 (ChatSessionRequestDto) */
export interface ChatSessionRequestDto {
    title: string | null;
}

/** ChatController POST /api/v1/chat/sessionrooms 응답 (ChatSessionResponseDto) */
export interface ChatSessionResponseDto {
    sessionId: string;
    companyId: number;
    employeeId: number;
    sessionTitle: string;
    createdAt: Date; // LocalDateTime ISO 문자열
}

/** ChatController POST /api/v1/chat/sessions/{sessionId}/ask 요청 (UserQuestionDto) */
export interface UserQuestionDto {
    message: string;
}

/** ChatController POST /api/v1/chat/sessions/{sessionId}/ask 응답 (AskResponseDto) */
export interface AskResponseDto {
    chatId: string;
    companyId: number;
    employeeId: number;
    sessionId: string;
    message: string;
    recordedAt: Date;
    role: "user" | "assistant" | string;
}

/** ChatController GET /api/v1/chat/sessions/{sessionId}/histories 응답 요소 (ChatHistory Entity) */
export interface ChatHistoryDto {
    chatId: string;
    id?: string;
    message: string;
    recordedAt: Date;
    role: "user" | "assistant" | string;
}

/** FileMetadata Entity & FileResponseDto (GET/POST /api/v1/files) */
export interface FileMetadataDto {
    fileId: string;
    companyId?: number;
    employeeId?: number | { employeeId: number; companyId?: { companyId: number } };
    originName: string;
    fileType: string;
    shared?: boolean;
    uploadedAt: Date | string;
}

/** UserController POST /api/v1/users 요청 (JoinRequestDTO) */
export interface JoinRequestDto {
    companyId: number;
    employeeId: number;
    password: string;
    username: string;
    email: string;
    role: UserRole;
}

/** FileController POST /api/v1/files/upload 응답 (FileUploadResponseDto) */
export interface FileUploadResponseDto {
    message: string;
    fileData: FileMetadataDto | null;
    parsedData: unknown[] | null;
}

/** FileController DELETE /api/v1/files/delete/{fileId} 응답 (FileDeleteResponseDto) */
export interface FileDeleteResponseDto {
    fileId: string | null;
    message: string;
    deletedAt: Date | null;
}
