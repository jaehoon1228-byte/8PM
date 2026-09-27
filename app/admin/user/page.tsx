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
            createdAt: Temporal.PlainDateTime.from("2026-01-01T00:00:00"),
        },
    ];

    const {
        queryText,
        role,
        createdAtStart,
        createdAtEnd,
        setQueryText,
        setRole,
        setCreatedAt,
    } = useUserFilterStore((state) => state);

    const changeFilter = ({
        role,
        queryText,
        createdAtStart,
        createdAtEnd,
    }: {
        role?: Role;
        queryText?: string;
        createdAtStart?: Temporal.PlainDateTime;
        createdAtEnd?: Temporal.PlainDateTime;
    }) => {
        if (!role || isRole(role)) {
            setRole(role);
        }
        setQueryText(queryText ?? "");
        setCreatedAt(createdAtStart, createdAtEnd);
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
                    <div className="flex flex-col gap-1 lg:flex-row">
                        <div className="flex flex-1 flex-row items-center justify-center gap-1">
                            <label
                                htmlFor="createdAtStart"
                                className="text-xs [writing-mode:vertical-rl]"
                            >
                                시작일
                            </label>
                            <input
                                className="flex-12 rounded-2xl border-2 border-white p-3"
                                type="date"
                                name="createdAtStart"
                                id="createdAtStart"
                                onChange={(e) => {
                                    try {
                                        changeFilter({
                                            createdAtStart:
                                                Temporal.PlainDateTime.from(
                                                    e.target.value,
                                                ),
                                        });
                                    } catch (err) {
                                        if (err instanceof RangeError) {
                                            changeFilter({
                                                createdAtStart: undefined,
                                            });
                                        } else {
                                            throw err;
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-1 flex-row items-center justify-center gap-1">
                            <label
                                htmlFor="createdAtEnd"
                                className="text-xs [writing-mode:vertical-rl]"
                            >
                                종료일
                            </label>
                            <input
                                className="flex-12 rounded-2xl border-2 border-white p-3"
                                type="date"
                                name="createdAtEnd"
                                id="createdAtEnd"
                                onChange={(e) => {
                                    try {
                                        changeFilter({
                                            createdAtEnd:
                                                Temporal.PlainDateTime.from(
                                                    e.target.value,
                                                ),
                                        });
                                    } catch (err) {
                                        if (err instanceof RangeError) {
                                            changeFilter({
                                                createdAtEnd: undefined,
                                            });
                                        } else {
                                            throw err;
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </>
            }
            contentElement={users
                .filter(
                    (value) =>
                        (!role || value.role == role) &&
                        (!createdAtStart ||
                            Temporal.PlainDateTime.compare(
                                value.createdAt,
                                createdAtStart,
                            ) >= 0) &&
                        (!createdAtEnd ||
                            Temporal.PlainDateTime.compare(
                                value.createdAt,
                                createdAtEnd,
                            ) <= 0) &&
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
