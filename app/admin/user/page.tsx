"use client";

import AdminPageContent from "@/components/AdminPageContent";
import AdminPageTableHeader from "@/components/AdminPageTableHeader";
import AdminPageUserEntry from "@/components/AdminPageUserEntry";
import { useUserFilterStore } from "@/providers/userFilterProvider";
import { adminPageUserColumns } from "@/types/adminPageUserColumns";
import { FileOrderBy } from "@/types/fileMetadata";
import { isRole, Role } from "@/types/role";
import User, { UserOrderBy } from "@/types/user";
import { useState } from "react";

export default function AdminUserPage() {
    // TODO: 샘플 데이터 사용 중. 추후 실제 DB에서 값을 가져올 것.
    const users: User[] = [
        {
            companyId: 0,
            companyName: "8PM",
            employeeId: 0,
            email: "test@example.org",
            role: "ROLE_MASTER",
            username: "admin",
            createdAt: Temporal.PlainDateTime.from("2026-01-01T00:00:00"),
        },
        {
            companyId: 0,
            companyName: "8PM",
            employeeId: 1,
            email: "test2@example.org",
            role: "ROLE_MANAGER",
            username: "man",
            createdAt: Temporal.PlainDateTime.from("2026-01-01T06:00:00"),
        },
        {
            companyId: 1,
            companyName: "TEST",
            employeeId: 1,
            email: "wow@example.org",
            role: "ROLE_USER",
            username: "test",
            createdAt: Temporal.PlainDateTime.from("2026-01-02T00:00:00"),
        },
    ];

    // Zustand Store에서 필터 State 사용
    const {
        queryText,
        role,
        createdAtStart,
        createdAtEnd,
        setQueryText,
        setRole,
        setCreatedAt,
    } = useUserFilterStore((state) => state);

    /**
     * 각 필터링 요소를 변경합니다.
     */
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

    const setSort = (newIsDesc?: boolean, newOrderBy?: UserOrderBy) => {
        if (newOrderBy) {
            setOrderBy(newOrderBy);
        }
        if (newIsDesc !== undefined && newOrderBy === orderBy) {
            setIsDesc(newIsDesc);
        }
    };

    const [isDesc, setIsDesc] = useState(false);
    const [orderBy, setOrderBy] = useState<UserOrderBy>("companyId");

    const gridStyle = `grid grid-cols-[1fr_1fr_1fr_1fr_1fr_3fr_3fr_1fr]`;

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
            sortElement={
                <div
                    className={`${gridStyle} bg-light border-t-2 border-white px-3 py-1`}
                >
                    {adminPageUserColumns.map((value) => (
                        <AdminPageTableHeader
                            key={value.name}
                            headerData={value}
                            isDesc={isDesc}
                            orderBy={orderBy}
                            setSort={
                                setSort as (
                                    newIsDesc?: boolean,
                                    newOrderBy?: FileOrderBy | UserOrderBy,
                                ) => void
                            }
                        />
                    ))}
                </div>
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
                .sort((a, b) => {
                    if (isDesc) {
                        b = [a, (a = b)][0];
                    }

                    if (orderBy === "companyId" || orderBy === "employeeId") {
                        return a[orderBy] - b[orderBy];
                    } else if (
                        orderBy === "companyName" ||
                        orderBy === "username" ||
                        orderBy === "email"
                    ) {
                        return a[orderBy].localeCompare(b[orderBy]);
                    } else if (orderBy === "role") {
                        enum RoleOrder {
                            ROLE_MASTER,
                            ROLE_MANAGER,
                            ROLE_USER,
                        }
                        if (!a[orderBy] || !b[orderBy]) {
                            throw new Error("역할이 비어 있습니다.");
                        }
                        const aEnum: RoleOrder = RoleOrder[a[orderBy]];
                        const bEnum: RoleOrder = RoleOrder[b[orderBy]];

                        return aEnum - bEnum;
                    } else if (orderBy === "createdAt") {
                        return Temporal.PlainDateTime.compare(
                            a[orderBy],
                            b[orderBy],
                        );
                    } else {
                        throw new Error("올바르지 않은 정렬 기준입니다.");
                    }
                })
                .map((value) => (
                    <AdminPageUserEntry
                        key={value.companyId + "_" + value.employeeId}
                        gridStyle={gridStyle}
                        {...value}
                    />
                ))}
        />
    );
}
