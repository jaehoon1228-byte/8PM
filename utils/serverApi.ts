// =====================================================================
// [SSR 전용] 서버 컴포넌트에서 사용하는 ky 인스턴스 & 데이터 조회 함수
//  - 브라우저가 보낸 HttpOnly refreshToken 쿠키를 서버에서 읽어 백엔드로 전달
//  - 백엔드 RefreshService 는 토큰 로테이션 없이 Access Token 만 재발급하므로 SSR 에 안전
//  - Access Token 을 1회만 발급받아 초기 API 들을 병렬 호출 (요청 수 최소화)
//  - next/headers 를 사용하므로 클라이언트 컴포넌트에서 import 하면 빌드 에러가 납니다.
// =====================================================================
import ky, { isHTTPError, type KyInstance } from "ky";
import type {
    AdminInitialData,
    ChatHistoryDto,
    ChatSessionResponseDto,
    DashboardInitialData,
    FileMetadataDto,
    Message,
    UserInfo,
} from "@/types/dashboard";
import {
    BACKEND_BASE_URL,
    ENDPOINTS,
    serializeUploadedFile,
    toChatSession,
    toMessageFromHistory,
    toUploadedFile,
} from "@/utils/endpoints";
import { isManagerOrAbove } from "@/utils/role";
import { cookies } from "next/headers";

/** SSR 인증 결과: 미인증·세션 만료 / 성공 */
type ServerAuth = { status: "expired" } | { status: "ok"; client: KyInstance };

/**
 * HttpOnly 쿠키의 refreshToken으로 Access Token 을 발급받아 SSR용 ky 클라이언트를 생성합니다.
 * 쿠키가 없거나 재발급에 실패하면 `expired`를 반환해 페이지 단에서 `/login`으로 리다이렉트합니다.
 * @returns 미인증/세션 만료(`expired`) 또는 인증된 클라이언트(`ok`)
 */
async function createServerApi(): Promise<ServerAuth> {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) return { status: "expired" };

    // JWTController: @PostMapping("/api/v1/jwt/refresh") @CookieValue("refreshToken")
    const refreshResponse = await ky.post(
        BACKEND_BASE_URL + ENDPOINTS.refresh,
        {
            headers: { Cookie: `refreshToken=${refreshToken}` },
            throwHttpErrors: false,
            cache: "no-store",
        },
    );

    const accessToken = refreshResponse.headers.get("Authorization");
    if (!refreshResponse.ok || !accessToken) {
        console.warn(
            `[SSR] ${refreshResponse.status}: ${refreshResponse.statusText}`,
        );
        return { status: "expired" };
    }

    const client = ky.create({
        baseUrl: BACKEND_BASE_URL,
        headers: { Authorization: accessToken },
        cache: "no-store", // 사용자별 데이터이므로 캐시 금지
        retry: 0,
    });

    return { status: "ok", client };
}

/**
 * 개별 API 호출을 감싸 실패가 페이지 전체 SSR을 깨뜨리지 않도록 null로 변환합니다.
 * optional 이 true 이고 404/403/405 이면 아직 구현되지 않은 엔드포인트로 보고 조용히 null 을 반환합니다.
 * @param label 로그에 표시할 조회 대상 이름
 * @param task 실행할 비동기 작업
 * @param optional 미구현 엔드포인트일 때 오류 로그를 생략할지 여부 (기본값 false)
 * @returns 작업 결과, 실패하면 null
 */
async function safe<T>(
    label: string,
    task: () => Promise<T>,
    optional = false,
): Promise<T | null> {
    try {
        return await task();
    } catch (error) {
        if (isHTTPError(error)) {
            // 아직 백엔드 컨트롤러에 미구현된 엔드포인트(404/405)는 조용히 빈 값으로 처리
            if (
                optional &&
                (error.response.status === 404 ||
                    error.response.status === 403 ||
                    error.response.status === 405)
            ) {
                console.warn(`[SSR] ${error}`);
                return null;
            }
            console.error(`[SSR] ${label} 조회 실패:`, error.response.status);
        } else {
            console.error(`[SSR] ${label} 조회 실패:`, error);
        }
        return null;
    }
}

/** 메인 화면 SSR 조회 결과: 세션 만료(`expired`) 또는 초기 데이터(`ok`) */
export type DashboardSSRResult =
    { status: "expired" } | { status: "ok"; data: DashboardInitialData };

/**
 * 메인 화면 초기 데이터를 서버에서 병렬 조회합니다.
 *  - GET /api/v1/users/me (UserController 구현 완료)
 *  - GET /api/v1/chat/sessions (spec.yaml 정의, 미구현 시 빈 배열로 안전하게 폴백)
 * @returns 세션 만료 시 `expired`, 그 외에는 조회된 사용자/대화방/개인 파일 초기 데이터
 */
export async function getDashboardInitialData(): Promise<DashboardSSRResult> {
    let auth: ServerAuth;
    try {
        auth = await createServerApi();
    } catch (error) {
        console.error("[SSR] 토큰 재발급 요청 실패:", error);
        return { status: "expired" };
    }

    if (auth.status === "expired") return { status: "expired" };

    const { client } = auth;
    const [userInfo, chatSessions, files] = await Promise.all([
        safe("사용자 정보", () =>
            client
                .get(ENDPOINTS.me)
                .json<Omit<UserInfo, "createdAt"> & { createdAt?: string }>(),
        ),
        safe(
            "대화방 목록",
            async () =>
                (
                    await client
                        .get(ENDPOINTS.chatSessions)
                        .json<ChatSessionResponseDto[]>()
                ).map(toChatSession),
            true,
        ),
        safe(
            "파일 목록",
            async () =>
                (await client.get(ENDPOINTS.files).json<FileMetadataDto[]>())
                    .filter((f) => !f.shared)
                    .map((f) => toUploadedFile(f)),
            true,
        ),
    ]);

    const personalFiles = (files ?? []).filter(
        (f) =>
            !f.shared &&
            (!userInfo?.employeeId ||
                f.employeeId === undefined ||
                f.employeeId === userInfo.employeeId),
    );

    return {
        status: "ok",
        data: {
            userInfo,
            // 대화방 목록 조회 API 가 아직 미구현(null)이더라도 빈 배열을 내려 불필요한 CSR 재요청 방지
            chatSessions: chatSessions ?? [],
            files: personalFiles.map(serializeUploadedFile),
        },
    };
}

/** 특정 채팅방 SSR 대화 내역 조회 결과 */
export type ChatHistoriesSSRResult =
    | { status: "expired" }
    | { status: "not-found" }
    | { status: "ok"; messages: Message[] };

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 문자열이 표준 UUID 형식인지 검사합니다.
 * @param value 검사할 문자열
 * @returns UUID 형식이면 true
 */
export function isValidUuid(value: string): boolean {
    return UUID_REGEX.test(value);
}

/**
 * 경로의 특정 `chatId`에 해당하는 과거 대화 내역만 서버에서 단독 조회합니다 (SSR).
 *  - GET /api/v1/chat/sessions/{chatId}/histories
 *  - UUID 형식이 아니거나 백엔드가 400/403/404를 반환하면 `not-found`를 반환합니다.
 * @param chatId URL 경로의 채팅방 UUID
 * @returns 세션 만료(`expired`), 미존재/권한없음(`not-found`), 또는 조회된 메시지 목록(`ok`)
 */
export async function getChatRoomHistories(
    chatId: string,
): Promise<ChatHistoriesSSRResult> {
    if (!isValidUuid(chatId)) {
        return { status: "not-found" };
    }

    let auth: ServerAuth;
    try {
        auth = await createServerApi();
    } catch (error) {
        console.error("[SSR-Chat] 토큰 재발급 요청 실패:", error);
        return { status: "expired" };
    }

    if (auth.status === "expired") return { status: "expired" };

    try {
        const dtos = await auth.client
            .get(ENDPOINTS.chatHistories(chatId))
            .json<ChatHistoryDto[]>();
        return {
            status: "ok",
            messages: dtos.map(toMessageFromHistory),
        };
    } catch (error) {
        if (isHTTPError(error)) {
            const status = error.response.status;
            if (status === 401) {
                return { status: "expired" };
            }
            if (status === 400 || status === 403 || status === 404) {
                return { status: "not-found" };
            }
            console.error(
                `[SSR-Chat] 대화 내역 조회 실패 (${chatId}):`,
                status,
            );
        } else {
            console.error(`[SSR-Chat] 대화 내역 조회 실패 (${chatId}):`, error);
        }
        throw error;
    }
}

/** 관리자 화면 SSR 조회 결과: 세션 만료(`expired`) 또는 초기 데이터(`ok`) */
export type AdminSSRResult =
    { status: "expired" } | { status: "ok"; data: AdminInitialData };

/**
 * 관리자 화면(/admin) 초기 데이터를 서버에서 병렬 조회합니다 (SSR).
 *  - GET /api/v1/users/me (현재 로그인 관리자 정보)
 *  - GET /api/v1/users (소속 회사 사용자 목록)
 *  - GET /api/v1/files?allCompany=true (공용 파일 + 사원별 개별 파일 목록)
 * @returns 세션 만료 시 `expired`, 그 외에는 관리자/사원/파일 초기 데이터
 */
export async function getAdminInitialData(): Promise<AdminSSRResult> {
    let auth: ServerAuth;
    try {
        auth = await createServerApi();
    } catch (error) {
        console.error("[SSR-Admin] 토큰 재발급 요청 실패:", error);
        return { status: "expired" };
    }

    if (auth.status === "expired") return { status: "expired" };

    const { client } = auth;
    const userInfo = await safe("관리자 정보", () =>
        client
            .get(ENDPOINTS.me)
            .json<Omit<UserInfo, "createdAt"> & { createdAt?: string }>(),
    );

    // 일반 사원은 관리자 전용 API를 불필요하게 호출하지 않도록 사전 차단
    if (!userInfo || !isManagerOrAbove(userInfo.role)) {
        return {
            status: "ok",
            data: {
                userInfo,
                companyUsers: null,
                sharedFiles: null,
                userFilesMap: null,
            },
        };
    }

    const [allUsers, allFiles] = await Promise.all([
        safe(
            "사원 목록",
            () =>
                client
                    .get(ENDPOINTS.users)
                    .json<
                        (Omit<UserInfo, "createdAt"> & { createdAt?: string })[]
                    >(),
            true,
        ),
        safe(
            "사내 전체 파일 목록",
            async () =>
                (
                    await client
                        .get(ENDPOINTS.files, {
                            searchParams: { allCompany: "true" },
                        })
                        .json<FileMetadataDto[]>()
                ).map((f) => toUploadedFile(f)),
            true,
        ),
    ]);

    const isMaster = String(userInfo?.role ?? "").includes("MASTER");
    const companyUsers =
        userInfo && allUsers
            ? isMaster
                ? allUsers
                : allUsers.filter(
                      (u) =>
                          u.companyId === userInfo.companyId &&
                          !String(u.role).includes("MASTER"),
                  )
            : null;

    const sharedFiles = allFiles
        ? allFiles
              .filter((f) => f.shared === true)
              .map((f) => ({ ...serializeUploadedFile(f), shared: true }))
        : null;

    let userFilesMap: AdminInitialData["userFilesMap"] = null;
    if (companyUsers && allFiles) {
        userFilesMap = {};
        for (const member of companyUsers) {
            userFilesMap[member.employeeId] = [];
        }
        for (const file of allFiles) {
            if (!file.shared && file.employeeId !== undefined) {
                if (!userFilesMap[file.employeeId]) {
                    userFilesMap[file.employeeId] = [];
                }
                userFilesMap[file.employeeId].push(serializeUploadedFile(file));
            }
        }
    }

    return {
        status: "ok",
        data: {
            userInfo,
            companyUsers,
            sharedFiles,
            userFilesMap,
        },
    };
}
