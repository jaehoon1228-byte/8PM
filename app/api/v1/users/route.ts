import { NextResponse } from "next/server";
import type { JoinRequestDto, UserRole } from "@/types/dashboard";
import { getMockDb, resolveMockUserFromRequest } from "@/utils/mockStore";

// [Mock API] UserController: GET /api/v1/users & POST /api/v1/users
// 백엔드 UserService.getUserForAdmin() / createUser() 로직과 1:1 대응

const PASSWORD_REGEX =
    /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*#?&])[A-Za-z0-9@$!%*#?&]{8,20}$/;

export async function GET(request: Request) {
    const currentUser = resolveMockUserFromRequest(request);
    const db = getMockDb();

    if (currentUser.role === "ROLE_USER") {
        return new NextResponse(
            "일반 사원은 사용자 목록을 조회할 권한이 없습니다.",
            { status: 403 },
        );
    }

    const users =
        currentUser.role === "ROLE_MASTER"
            ? db.users
            : db.users.filter(
                  (u) =>
                      u.companyId === currentUser.companyId &&
                      u.role !== "ROLE_MASTER",
              );

    const payload = users.map((u) => ({
        companyId: u.companyId,
        employeeId: u.employeeId,
        username: u.username,
        email: u.email,
        role: u.role,
        companyName: u.companyName,
        createdAt: u.createdAt,
    }));

    return NextResponse.json(payload);
}

export async function POST(request: Request) {
    const currentUser = resolveMockUserFromRequest(request);
    const db = getMockDb();

    if (currentUser.role === "ROLE_USER") {
        return new NextResponse("일반 사원은 계정을 생성할 권한이 없습니다.", {
            status: 403,
        });
    }

    const dto = (await request.json().catch(() => null)) as Partial<JoinRequestDto> | null;
    if (
        !dto ||
        dto.companyId === undefined ||
        dto.employeeId === undefined ||
        !dto.password ||
        !dto.username ||
        !dto.email ||
        !dto.role
    ) {
        return new NextResponse("필수 입력값이 누락되었습니다.", {
            status: 400,
        });
    }

    const companyId = Number(dto.companyId);
    const employeeId = Number(dto.employeeId);

    if (!PASSWORD_REGEX.test(dto.password)) {
        return new NextResponse(
            "비밀번호는 8~20자리이며, 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.",
            { status: 400 },
        );
    }

    if (currentUser.role === "ROLE_MANAGER") {
        if (dto.role === "ROLE_MASTER" || dto.role === "ROLE_MANAGER") {
            return new NextResponse(
                "중간관리자는 하위관리자 계정만 생성할 수 있습니다.",
                { status: 403 },
            );
        }
        if (companyId !== currentUser.companyId) {
            return new NextResponse(
                "중간 관리자는 본인 소속 회사 직원만 등록이 가능합니다.",
                { status: 403 },
            );
        }
    }

    const exists = db.users.some(
        (u) => u.companyId === companyId && u.employeeId === employeeId,
    );
    if (exists) {
        return new NextResponse("이미 등록된 사원입니다.", { status: 409 });
    }

    const existingCompanyUser = db.users.find(
        (u) => u.companyId === companyId && u.companyName,
    );

    db.users.push({
        companyId,
        companyName:
            existingCompanyUser?.companyName ??
            currentUser.companyName ??
            `회사 #${companyId}`,
        employeeId,
        username: dto.username.trim(),
        email: dto.email.trim(),
        password: dto.password,
        role: dto.role as UserRole,
        createdAt: new Date().toISOString(),
    });

    return new NextResponse("계정이 성공적으로 생성 완료.", { status: 201 });
}
