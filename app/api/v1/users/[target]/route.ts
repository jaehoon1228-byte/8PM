import { NextResponse } from "next/server";
import type { UserRole } from "@/types/dashboard";
import { getMockDb, resolveMockUserFromRequest } from "@/utils/mockStore";

// [Mock API] UserController: DELETE /api/v1/users/{target} & PATCH /api/v1/users/{target}
// 백엔드 UserService.deleteUser() / updateRole() 로직과 1:1 대응

export async function DELETE(
    request: Request,
    context: { params: Promise<{ target: string }> },
) {
    const currentUser = resolveMockUserFromRequest(request);
    const { target } = await context.params;
    const targetEmployeeId = Number(target);
    const db = getMockDb();

    if (currentUser.role === "ROLE_USER") {
        return new NextResponse("하위관리자는 탈퇴 권한이 없습니다.", {
            status: 403,
        });
    }

    const targetIndex = db.users.findIndex(
        (u) => u.employeeId === targetEmployeeId,
    );
    if (targetIndex === -1) {
        return new NextResponse("유저가 존재하지 않습니다.", { status: 404 });
    }

    const targetUser = db.users[targetIndex];

    if (currentUser.role === "ROLE_MANAGER") {
        if (currentUser.companyId !== targetUser.companyId) {
            return new NextResponse("타 회사회원은 탈퇴시킬 수 없습니다.", {
                status: 403,
            });
        }
        const isSelf = currentUser.employeeId === targetEmployeeId;
        const isTargetUserRole = targetUser.role === "ROLE_USER";
        if (!isSelf && !isTargetUserRole) {
            return new NextResponse(
                "중간관리자는 본인 또는 하위관리자만 탈퇴 시킬 수 있습니다.",
                { status: 403 },
            );
        }
    }

    db.users.splice(targetIndex, 1);
    db.files = db.files.filter(
        (f) => !(f.employeeId === targetEmployeeId && !f.shared),
    );

    return new NextResponse("회원이 탈퇴되었습니다.", { status: 200 });
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ target: string }> },
) {
    const currentUser = resolveMockUserFromRequest(request);
    const { target } = await context.params;
    const targetEmployeeId = Number(target);
    const newRoleCode = (await request.text()).trim() as UserRole;
    const db = getMockDb();

    if (currentUser.role !== "ROLE_MASTER") {
        return new NextResponse(
            "권한 승격은 및 강등 진행은 최고관리자만 가능합니다.",
            { status: 403 },
        );
    }

    const targetUser = db.users.find((u) => u.employeeId === targetEmployeeId);
    if (!targetUser) {
        return new NextResponse("존재하지 않는 회원입니다.", { status: 404 });
    }

    if (
        newRoleCode !== "ROLE_MASTER" &&
        newRoleCode !== "ROLE_MANAGER" &&
        newRoleCode !== "ROLE_USER"
    ) {
        return new NextResponse("유효하지 않은 권한 코드입니다.", {
            status: 400,
        });
    }

    targetUser.role = newRoleCode;
    return new NextResponse("권한이 수정되었습니다.", { status: 200 });
}
