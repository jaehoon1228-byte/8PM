// =====================================================================
// [SSR 전용] 서버 컴포넌트에서 사용하는 ky 인스턴스 & 데이터 조회 함수
//  - 브라우저가 보낸 HttpOnly refreshToken 쿠키를 서버에서 읽어 백엔드로 전달
//  - 백엔드 RefreshService 는 토큰 로테이션 없이 Access Token 만 재발급하므로 SSR 에 안전
//  - Access Token 을 1회만 발급받아 초기 API 들을 병렬 호출 (요청 수 최소화)
//  - next/headers 를 사용하므로 클라이언트 컴포넌트에서 import 하면 빌드 에러가 납니다.
// =====================================================================
import ky, { isHTTPError, type KyInstance } from "ky";
import { cookies } from "next/headers";
import type {
    ChatSessionResponseDto,
    DashboardInitialData,
    UserInfo,
} from "@/types/dashboard";
import { BACKEND_BASE_URL, ENDPOINTS, toChatSession } from "@/utils/endpoints";

// 컨테이너 내부망 주소가 따로 있다면 BACKEND_INTERNAL_HOST 로 지정 (없으면 공개 주소 사용)
const serverBaseUrl = process.env.BACKEND_INTERNAL_HOST ?? BACKEND_BASE_URL;

/** SSR 인증 결과: 쿠키 없음 / 세션 만료 / 성공 */
type ServerAuth =
    | { status: "no-cookie" }
    | { status: "expired" }
    | { status: "ok"; client: KyInstance };

async function createServerApi(): Promise<ServerAuth> {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    // 로컬 개발 환경 등 쿠키 도메인이 달라 서버가 쿠키를 받지 못한 경우 → CSR 로 위임
    if (!refreshToken) return { status: "no-cookie" };

    // JWTController: @PostMapping("/api/v1/jwt/refresh") @CookieValue("refreshToken")
    const refreshResponse = await ky.post(serverBaseUrl + ENDPOINTS.refresh, {
        headers: { Cookie: `refreshToken=${refreshToken}` },
        throwHttpErrors: false,
        cache: "no-store",
        timeout: 5000,
    });

    const accessToken = refreshResponse.headers.get("Authorization");
    if (!refreshResponse.ok || !accessToken) {
        return refreshResponse.status === 401 || refreshResponse.status === 403
            ? { status: "expired" }
            : { status: "no-cookie" }; // 백엔드 일시 장애 등 → CSR 재시도
    }

    const client = ky.create({
        baseUrl: serverBaseUrl,
        headers: { Authorization: accessToken },
        cache: "no-store", // 사용자별 데이터이므로 캐시 금지
        timeout: 5000, // SSR 이 백엔드 지연으로 무한 대기하지 않도록 제한
        retry: 0,
    });

    return { status: "ok", client };
}

/** 개별 API 실패가 페이지 전체 SSR 을 깨뜨리지 않도록 null 로 변환 */
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
                (error.response.status === 404 || error.response.status === 405)
            ) {
                return null;
            }
            console.error(`[SSR] ${label} 조회 실패:`, error.response.status);
        } else {
            console.error(`[SSR] ${label} 조회 실패:`, error);
        }
        return null;
    }
}

export type DashboardSSRResult =
    | { status: "expired" }
    | { status: "ok"; data: DashboardInitialData };

/**
 * 메인 화면 초기 데이터를 서버에서 병렬 조회
 *  - GET /api/v1/users/me (UserController 구현 완료)
 *  - GET /api/v1/chat/sessions (spec.yaml 정의, 미구현 시 빈 배열로 안전하게 폴백)
 */
export async function getDashboardInitialData(): Promise<DashboardSSRResult> {
    const empty: DashboardInitialData = {
        userInfo: null,
        chatSessions: null,
        files: null,
    };

    let auth: ServerAuth;
    try {
        auth = await createServerApi();
    } catch (error) {
        console.error("[SSR] 토큰 재발급 요청 실패:", error);
        return { status: "ok", data: empty };
    }

    if (auth.status === "expired") return { status: "expired" };
    if (auth.status === "no-cookie") return { status: "ok", data: empty };

    const { client } = auth;
    const [userInfo, chatSessions] = await Promise.all([
        safe("사용자 정보", () => client.get(ENDPOINTS.me).json<UserInfo>()),
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
    ]);

    return {
        status: "ok",
        data: {
            userInfo,
            // 대화방 목록 조회 API 가 아직 미구현(null)이더라도 빈 배열을 내려 불필요한 CSR 재요청 방지
            chatSessions: chatSessions ?? [],
            files: [],
        },
    };
}
