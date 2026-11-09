import { NextResponse } from "next/server";
import type { JoinRequestDto, UserRole } from "@/types/dashboard";
import { getMockDb, resolveMockUserFromRequest } from "@/utils/mockStore";

// [Mock API] UserController: GET /api/v1/users & POST /api/v1/users
// 백엔드 UserService.getUserForAdmin() / createUser() 로직과 1:1 대응

/**
 * 비밀번호 정책 정규식입니다.
 * 8~20자, 영문/숫자/특수문자(@$!%*#?&)를 각각 1개 이상 포함해야 합니다.
 */
const PASSWORD_REGEX =
    /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*#?&])[A-Za-z0-9@$!%*#?&]{8,20}$/;

/**
 * 사용자 목록을 조회합니다 (Mock UserController GET).
 * 최고관리자는 전체 사용자를, 중간관리자는 본인 회사의 최고관리자를 제외한 사용자를 조회합니다. 일반 사원은 403 을 반환합니다.
 * @param request 현재 HTTP 요청 (요청자 식별에 사용)
 * @returns 사용자 목록 JSON 응답 (비밀번호 제외). 권한이 없으면 403 텍스트 응답
 */
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

/**
 * 사용자 계정을 생성합니다 (Mock UserController POST).
 * 요청자 권한, 필수값, 비밀번호 정책, 중간관리자의 생성 범위(상위 권한 및 타 회사 불가), 중복 사원 여부를 검증합니다.
 * @param request 생성할 사용자 정보(JoinRequestDto)를 담은 JSON 요청
 * @returns 생성 성공 시 201, 검증 실패 시 400/403/409 텍스트 응답
 */
export async function POST(request: Request) {
    const currentUser = resolveMockUserFromRequest(request);
    const db = getMockDb();

    if (currentUser.role === "ROLE_USER") {
        return new NextResponse("일반 사원은 계정을 생성할 권한이 없습니다.", {
            status: 403,
        });
    }

    const dto = (await request
        .json()
        .catch(() => null)) as Partial<JoinRequestDto> | null;
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
        createdAt: Temporal.Now.plainDateTimeISO(),
    });

    return new NextResponse("계정이 성공적으로 생성 완료.", { status: 201 });
}
