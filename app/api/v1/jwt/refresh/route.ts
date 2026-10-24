import { NextResponse } from "next/server";

// [Mock API] POST /api/v1/jwt/refresh
export async function POST() {
    console.log("[Mock API] 토큰 갱신 요청 수신");
    const newAccessToken = "mock-refreshed-token-" + Date.now();

    return new NextResponse("토큰 재발급 성공 (Mock)", {
        status: 200,
        headers: {
            Authorization: "Bearer " + newAccessToken,
        },
    });
}
