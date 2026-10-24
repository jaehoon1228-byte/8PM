import { NextResponse } from "next/server";

// [Mock API] POST /api/v1/login
// - 로컬 개발 및 백엔드 미구동 환경 테스트용
// - AWS 배포 시: NEXT_PUBLIC_BACKEND_HOST가 실제 백엔드 도메인(예: https://api.mes...)으로 지정되면
//   브라우저 요청이 실제 백엔드로 직행하므로 이 라우트는 전혀 호출되지 않습니다.
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        console.log("[Mock API] 로그인 요청 수신:", body);

        // 임의의 Mock JWT 토큰 생성
        const mockAccessToken =
            "mock-access-token-" + Buffer.from(JSON.stringify(body)).toString("base64");
        const mockRefreshToken = "mock-refresh-token-" + Date.now();

        return NextResponse.json(
            {
                message: "Login Success (Mock)",
                refreshToken: mockRefreshToken,
            },
            {
                status: 200,
                headers: {
                    Authorization: "Bearer " + mockAccessToken,
                },
            },
        );
    } catch {
        return NextResponse.json({ message: "Mock login failed" }, { status: 500 });
    }
}
