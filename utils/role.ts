/** 중간관리자(ROLE_MANAGER) 이상 권한 여부 확인 (중간관리자, 최고관리자) */
export function isManagerOrAbove(role?: string): boolean {
    if (!role) return false;
    const upper = role.toUpperCase();
    return upper.includes("MASTER") || upper.includes("MANAGER") || upper.includes("MANEGER");
}
