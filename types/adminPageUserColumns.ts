import OrderBy from "./orderBy";

export type AdminPageUserColumn = {
    name: OrderBy;
    displayName: string;
};

export const adminPageUserColumns: AdminPageUserColumn[] = [
    { name: "companyId", displayName: "사번" },
    { name: "companyName", displayName: "사명" },
    { name: "employeeId", displayName: "사원번호" },
    { name: "username", displayName: "사원명" },
    { name: "role", displayName: "역할" },
    { name: "email", displayName: "이메일" },
    { name: "createdAt", displayName: "가입일" },
];
