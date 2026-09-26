import { getRoleName, Role } from "@/types/role";

type UserData = {
    companyId: number;
    companyName: string;
    employeeId: number;
    username: string;
    role: Role;
    email: string;
};

export default function AdminPageUserEntry({
    companyId,
    companyName,
    employeeId,
    username,
    role,
    email,
}: UserData) {
    return (
        <div className="flex flex-row justify-between border-y-2 border-white p-3">
            <div className="flex flex-row gap-2 md:gap-5">
                <p>{companyId}</p>
                <p>{companyName}</p>
                <p>{employeeId}</p>
                <p>{username}</p>
                <p>{getRoleName(role)}</p>
                <p>{email}</p>
            </div>
            <div
                tabIndex={0}
                className="font-bold text-red-700 hover:cursor-pointer"
            >
                삭제
            </div>
        </div>
    );
}
