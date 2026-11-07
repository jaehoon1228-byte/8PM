import { NextResponse } from "next/server";
import { resolveMockUserFromRequest } from "@/utils/mockStore";

// [Mock API] GET /api/v1/users/me
// 백엔드 UserInfoResponseDTO 규격
export async function GET(request: Request) {
    const user = resolveMockUserFromRequest(request);
    return NextResponse.json({
        companyId: user.companyId,
        companyName: user.companyName,
        employeeId: user.employeeId,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    });
}
