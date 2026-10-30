import { NextResponse } from "next/server";

// [Mock API] GET /api/v1/users/me
// 백엔드 UserInfoResponseDTO 규격
export async function GET() {
    console.log("[Mock API] 내 정보 조회 (/users/me)");
    return NextResponse.json({
        companyId: 10,
        companyName: "한국제조 스마트팩토리",
        employeeId: 20260041,
        username: "홍길동",
        email: "gildong.hong@mes-factory.com",
        role: "ROLE_MANAGER",
        createdAt: "2026-06-09T18:00:00Z",
    });
}
