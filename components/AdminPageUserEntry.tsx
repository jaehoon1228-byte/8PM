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
        <div
            key={employeeId}
            className="border-y-2 border-white flex-row flex justify-between p-3"
        >
            <div className="flex flex-row gap-10">
                <p>{companyId}</p>
                <p>{companyName}</p>
                <p>{employeeId}</p>
                <p>{username}</p>
                <p>{getRoleName(role)}</p>
                <p>{email}</p>
            </div>
            <div
                tabIndex={0}
                className="hover:cursor-pointer text-red-700 font-bold"
            >
                삭제
            </div>
        </div>
    );
}
