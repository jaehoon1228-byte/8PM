import { Role } from "./role";

export type User = {
    companyId: number;
    companyName: string;
    employeeId: number;
    email: string;
    role: Role;
    username: string;
};
