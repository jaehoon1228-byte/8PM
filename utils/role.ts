/**
 * 권한 등급이 중간관리자(ROLE_MANAGER) 이상인지 확인합니다.
 * @param role 권한 문자열 (예: ROLE_MANAGER, ROLE_MASTER). 대소문자는 구분하지 않습니다.
 * @returns 중간관리자 이상이면 true, 권한이 없거나 판단할 수 없으면 false
 */
export function isManagerOrAbove(role?: string): boolean {
    if (!role) return false;
    const upper = role.toUpperCase();
    return (
        upper.includes("MASTER") ||
        upper.includes("MANAGER") ||
        upper.includes("MANEGER")
    );
}

/**
 * 로그인한 사용자가 진입해야 할 홈 경로를 반환합니다.
 * 역할별로 다른 페이지로 보내야 할 경우 이 함수만 수정합니다.
 * @param role 권한 문자열 (예: ROLE_USER, ROLE_MANAGER)
 * @returns 홈 경로 (현재는 모든 역할이 `/chat`)
 */
export function getHomePath(role?: string): string {
    // linter 경고 방지
    void role;
    return "/chat";
}

