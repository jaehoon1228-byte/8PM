import ky, { KyRequest } from "ky";
import { nowMs } from "@/utils/time";

/** 백엔드 API 기본 주소 (환경변수 NEXT_PUBLIC_BACKEND_HOST, 없으면 localhost:8080) */
export const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8080";

// [보안 & 성능 최적화]
//  1) XSS 방어: Access Token 을 localStorage 가 아닌 클로저 메모리 변수에만 보관
//  2) 네트워크 최적화: 동시 다발적인 API 호출 시 /api/v1/jwt/refresh 중복 요청을 단일 Promise 로 병합(Deduplication)
const ACCESS_TOKEN_TTL_MS = 5 * 60 * 1000;
let cachedAccessToken: string | null = null;
let cachedTokenExpiresAt = 0;
let inflightRefreshPromise: Promise<string | null> | null = null;

/**
 * 메모리에 캐시된 Access Token, 만료 시각, 진행 중인 재발급 Promise를 모두 초기화합니다.
 */
export function clearCachedAccessToken(): void {
    cachedAccessToken = null;
    cachedTokenExpiresAt = 0;
    inflightRefreshPromise = null;
}

/**
 * Access Token을 메모리에 캐시하고 5분 뒤 만료되도록 설정합니다.
 * `Bearer ` 접두사가 없으면 자동으로 붙이며, null 이면 캐시를 비웁니다.
 * @param token 저장할 Access Token (null 이면 캐시 초기화)
 */
export function setCachedAccessToken(token: string | null): void {
    if (token) {
        cachedAccessToken = token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`;
        cachedTokenExpiresAt = nowMs() + ACCESS_TOKEN_TTL_MS;
    } else {
        clearCachedAccessToken();
    }
}

/**
 * 캐시된 Access Token을 재사용하거나, 필요하면 /api/v1/jwt/refresh로 새로 발급받습니다.
 * 동시에 여러 요청이 들어와도 재발급 요청은 하나의 Promise 로 병합됩니다.
 * @param forceRefresh true이면 캐시를 무시하고 강제로 재발급합니다
 * @returns 사용할 Access Token (`Bearer ...` 형식), 발급에 실패하면 null
 */
async function fetchOrReuseAccessToken(
    forceRefresh = false,
): Promise<string | null> {
    const now = nowMs();
    if (!forceRefresh && cachedAccessToken && now < cachedTokenExpiresAt) {
        return cachedAccessToken;
    }

    if (inflightRefreshPromise) {
        return inflightRefreshPromise;
    }

    inflightRefreshPromise = (async () => {
        try {
            const accessTokenResponse = await ky.post(
                baseUrl + "/api/v1/jwt/refresh",
                {
                    credentials: "include",
                },
            );
            if (accessTokenResponse.ok) {
                const token = accessTokenResponse.headers.get("Authorization");
                if (token) {
                    cachedAccessToken = token;
                    cachedTokenExpiresAt = nowMs() + ACCESS_TOKEN_TTL_MS;
                    return token;
                }
            }
            return null;
        } finally {
            inflightRefreshPromise = null;
        }
    })();

    return inflightRefreshPromise;
}

/**
 * 획득한 Access Token을 요청의 Authorization 헤더에 설정합니다. 토큰이 없으면 헤더를 설정하지 않습니다.
 * @param request 헤더를 설정할 ky 요청 객체
 * @param forceRefresh true 이면 토큰을 강제로 재발급합니다
 * @returns 헤더 설정이 끝나면 완료되는 Promise
 */
async function getAccessToken(request: KyRequest, forceRefresh = false) {
    const accessToken = await fetchOrReuseAccessToken(forceRefresh);
    if (accessToken) {
        request.headers.set("Authorization", accessToken);
    }
}

/**
 * 백엔드 호출용 공용 ky 인스턴스입니다.
 * - beforeRequest: 모든 요청에 Access Token 을 Authorization 헤더로 설정합니다.
 * - afterResponse: 401 응답이면 토큰을 강제 재발급한 뒤 1회 재시도합니다.
 */
export const api = ky.extend({
    baseUrl,
    hooks: {
        // 2. 요청(Request) 인터셉터: 모든 API 호출 전에 알아서 헤더에 Access Token을 꽂아줌
        beforeRequest: [
            async ({ request }) => {
                await getAccessToken(request, false);
            },
        ],
        // 3. 응답(Response) 인터셉터: 401 수신 시 메모리 캐시를 무효화하고 강제 재발급 후 1회 재시도
        afterResponse: [
            async ({ request, response, retryCount }) => {
                if (response.status === 401 && retryCount <= 0) {
                    ++retryCount;
                    clearCachedAccessToken();
                    await getAccessToken(request, true);
                    return ky.retry({ request });
                }
                return response;
            },
        ],
    },
    credentials: "include",
});

