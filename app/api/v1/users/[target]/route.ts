import { NextResponse } from "next/server";
import type { UserRole } from "@/types/dashboard";
import { getMockDb, resolveMockUserFromRequest } from "@/utils/mockStore";

// [Mock API] UserController: DELETE /api/v1/users/{target} & PATCH /api/v1/users/{target}
// 백엔드 UserService.deleteUser() / updateRole() 로직과 1:1 대응

/**
 * 사용자를 탈퇴시킵니다 (Mock UserController DELETE).
 * 중간관리자는 같은 회사의 본인 또는 하위관리자만 탈퇴시킬 수 있습니다. 탈퇴 시 해당 사원의 개인 파일도 함께 삭제합니다.
 * @param request 현재 HTTP 요청 (요청자 식별에 사용)
 * @param context 동적 경로 파라미터 컨텍스트. `params.target` 은 대상 사원 ID 입니다.
 * @returns 탈퇴 성공 시 200, 권한 없음 403, 대상 없음 404 텍스트 응답
 */
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

/**
 * 사용자의 권한을 변경합니다 (Mock UserController PATCH).
 * 최고관리자만 호출할 수 있으며, 요청 본문으로 받은 권한 코드(ROLE_MASTER, ROLE_MANAGER, ROLE_USER)로 변경합니다.
 * @param request 요청 본문에 새 권한 코드를 담은 HTTP 요청
 * @param context 동적 경로 파라미터 컨텍스트. `params.target` 은 대상 사원 ID 입니다.
 * @returns 변경 성공 시 200, 권한 없음 403, 대상 없음 404, 잘못된 권한 코드 400 텍스트 응답
 */
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
