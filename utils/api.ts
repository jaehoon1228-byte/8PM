import ky, { KyRequest } from "ky";

export const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8080";

async function getAccessToken(request: KyRequest) {
    const accessTokenResponse = await ky.post(baseUrl + "/api/v1/jwt/refresh", {
        credentials: "include",
    });
    if (accessTokenResponse.ok) {
        const accessToken = accessTokenResponse.headers.get("Authorization");

        if (accessToken) {
            request.headers.set("Authorization", accessToken);
        }
    }
}

// 1. 기본 API 인스턴스 생성
export const api = ky.extend({
    baseUrl,
    hooks: {
        // 2. 요청(Request) 인터셉터: 모든 API 호출 전에 알아서 헤더에 Access Token을 꽂아줌
        beforeRequest: [
            async ({ request }) => {
                await getAccessToken(request);
            },
        ],
        // 3. 응답(Response) 인터셉터: 여기서 '몰래 재발급' 마법이 일어납니다.
        afterResponse: [
            async ({ request, response, retryCount }) => {
                if (response.status === 401 && retryCount <= 0) {
                    ++retryCount;

                    await getAccessToken(request);
                    return ky.retry({ request });
                }
                return response;
            },
        ],
    },
    credentials: "include",
});
