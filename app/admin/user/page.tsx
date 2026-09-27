"use client";

import AdminPageContent from "@/components/AdminPageContent";
import AdminPageUserEntry from "@/components/AdminPageUserEntry";
import { useUserFilterStore } from "@/providers/userFilterProvider";
import { isRole, Role } from "@/types/role";
import { User } from "@/types/user";

export default function AdminUserPage() {
    const users: User[] = [
        {
            companyId: 0,
            companyName: "8PM",
            employeeId: 0,
            email: "test@example.org",
            role: "ROLE_MANAGER",
            username: "admin",
            createdAt: new Date("2026-01-01T00:00:00"),
        },
    ];

    const { queryText, role, setQueryText, setRole } = useUserFilterStore(
        (state) => state,
    );

    const changeFilter = ({
        role,
        queryText,
    }: {
        role?: Role;
        queryText?: string;
    }) => {
        if (!role || isRole(role)) {
            setRole(role);
        }
        setQueryText(queryText ?? "");
    };

    return (
        <AdminPageContent
            pageType="user"
            searchElement={
                <>
                    <input
                        type="text"
                        name="queryText"
                        className="flex-2 rounded-2xl border-2 border-white p-3"
                        placeholder="검색 시작하기..."
                        value={queryText}
                        onChange={(e) =>
                            changeFilter({ queryText: e.target.value })
                        }
                    />
                    <select
                        name="role"
                        id="role"
                        className="flex-1 rounded-2xl border-2 border-white p-3"
                        value={role}
                        onChange={(e) => {
                            changeFilter({ role: e.target.value as Role });
                        }}
                    >
                        <option value="">역할 선택...</option>
                        <option value="ROLE_USER">사용자</option>
                        <option value="ROLE_MANAGER">담당자</option>
                        <option value="ROLE_MASTER">관리자</option>
                    </select>
                </>
            }
            contentElement={users
                .filter(
                    (value) =>
                        (!role || value.role == role) &&
                        (!queryText ||
                            value.username.includes(queryText) ||
                            String(value.employeeId) == queryText ||
                            value.companyName.includes(queryText) ||
                            String(value.companyId) == queryText ||
                            value.email.includes(queryText)),
                )
                .map((value) => (
                    <AdminPageUserEntry key={value.employeeId} {...value} />
                ))}
        />
    );
}
