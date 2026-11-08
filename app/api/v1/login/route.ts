import { NextResponse } from "next/server";
import { getMockDb } from "@/utils/mockStore";
import { nowMs } from "@/utils/time";

// [Mock API] POST /api/v1/login
// - 로컬 개발 및 백엔드 미구동 환경 테스트용
export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => ({}))) as {
            companyId?: string | number;
            employeeId?: string | number;
            password?: string;
        };

        const db = getMockDb();
        const reqCompanyId = Number(body.companyId);
        const reqEmployeeId = Number(body.employeeId);

        let targetUser = db.users.find(
            (u) =>
                u.companyId === reqCompanyId &&
                u.employeeId === reqEmployeeId,
        );

        if (!targetUser) {
            targetUser = db.users.find(
                (u) => u.employeeId === reqEmployeeId,
            );
        }

        if (!targetUser) {
            targetUser =
                db.users.find((u) => u.role === "ROLE_MANAGER") ?? db.users[0];
        }

        const identity = `${targetUser.companyId}_${targetUser.employeeId}`;
        const mockAccessToken = `mock-access-${identity}-${nowMs()}`;
        const mockRefreshToken = `mock-refresh-${identity}-${nowMs()}`;

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
        return NextResponse.json(
            { message: "Mock login failed" },
            { status: 500 },
        );
    }
}
