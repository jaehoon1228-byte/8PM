import ky, { KyRequest } from "ky";

export const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8080";

// [보안 & 성능 최적화]
//  1) XSS 방어: Access Token 을 localStorage 가 아닌 클로저 메모리 변수에만 보관
//  2) 네트워크 최적화: 동시 다발적인 API 호출 시 /api/v1/jwt/refresh 중복 요청을 단일 Promise 로 병합(Deduplication)
const ACCESS_TOKEN_TTL_MS = 5 * 60 * 1000;
let cachedAccessToken: string | null = null;
let cachedTokenExpiresAt = 0;
let inflightRefreshPromise: Promise<string | null> | null = null;

export function clearCachedAccessToken(): void {
    cachedAccessToken = null;
    cachedTokenExpiresAt = 0;
    inflightRefreshPromise = null;
}

export function setCachedAccessToken(token: string | null): void {
    if (token) {
        cachedAccessToken = token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`;
        cachedTokenExpiresAt = Date.now() + ACCESS_TOKEN_TTL_MS;
    } else {
        clearCachedAccessToken();
    }
}

async function fetchOrReuseAccessToken(forceRefresh = false): Promise<string | null> {
    const now = Date.now();
    if (
        !forceRefresh &&
        cachedAccessToken &&
        now < cachedTokenExpiresAt
    ) {
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
                    cachedTokenExpiresAt = Date.now() + ACCESS_TOKEN_TTL_MS;
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

async function getAccessToken(request: KyRequest, forceRefresh = false) {
    const accessToken = await fetchOrReuseAccessToken(forceRefresh);
    if (accessToken) {
        request.headers.set("Authorization", accessToken);
    }
}

// 1. 기본 API 인스턴스 생성
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
