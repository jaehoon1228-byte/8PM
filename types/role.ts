const avaliableRoles = ["ROLE_USER", "ROLE_MANAGER", "ROLE_MASTER"] as const;
export type Role = (typeof avaliableRoles)[number];

export function isRole(value: string): value is Role {
    return avaliableRoles.includes(value as Role);
}

/**
 * Role에서 역할 이름을 얻습니다.
 * @param role {@link Role}
 * @returns "관리자" | "담당자" | "사용자"
 */
export function getRoleName(role: Role) {
    switch (role) {
        case "ROLE_MASTER": {
            return "관리자";
        }
        case "ROLE_MANAGER": {
            return "담당자";
        }
        case "ROLE_USER": {
            return "사용자";
        }
        default: {
            throw new Error(
                "role은 ROLE_MASTER, ROLE_MANAGER, ROLE_USER 중 하나여야 합니다.",
            );
        }
    }
}
