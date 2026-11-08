import { NextResponse } from "next/server";
import { resolveMockUserFromRequest } from "@/utils/mockStore";
import { nowMs } from "@/utils/time";

// [Mock API] POST /api/v1/jwt/refresh
export async function POST(request: Request) {
    const user = resolveMockUserFromRequest(request);
    const identity = `${user.companyId}_${user.employeeId}`;
    const newAccessToken = `mock-access-${identity}-${nowMs()}`;

    return new NextResponse("토큰 재발급 성공 (Mock)", {
        status: 200,
        headers: {
            Authorization: "Bearer " + newAccessToken,
        },
    });
}
