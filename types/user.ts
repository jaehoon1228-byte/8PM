import { Role } from "./role";
export default interface User {
    companyId: number;
    companyName: string;
    employeeId: number;
    email: string;
    role: Role;
    username: string;
    createdAt: Temporal.PlainDateTime;
}

export const userProperties: (keyof User)[] = [
    "companyId",
    "companyName",
    "employeeId",
    "email",
    "role",
    "username",
    "createdAt",
];
export type UserOrderBy = (typeof userProperties)[number];
