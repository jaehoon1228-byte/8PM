import { getRoleName } from "@/types/role";
import User from "@/types/user";

export default function AdminPageUserEntry({
    companyId,
    companyName,
    employeeId,
    username,
    role,
    email,
    createdAt,
    gridStyle,
}: User & { gridStyle: string }) {
    return (
        <div
            className={`${gridStyle} flex flex-9 flex-row justify-between border-y-2 border-white p-3 text-center`}
        >
            <p>{companyId}</p>
            <p>{companyName}</p>
            <p>{employeeId}</p>
            <p>{username}</p>
            <p>{getRoleName(role)}</p>
            <p>{email}</p>
            <p>{createdAt.toLocaleString()}</p>
            <div
                tabIndex={0}
                className="flex-1 font-bold text-red-700 hover:cursor-pointer"
            >
                삭제
            </div>
        </div>
    );
}
