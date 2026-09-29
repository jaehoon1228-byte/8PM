import OrderBy from "@/types/orderBy";
import Triangle from "./Triangle";
import { AdminPageUserColumn } from "@/types/adminPageUserColumns";

export default function AdminPageTableHeader({
    headerData,
    orderBy,
    isDesc,
    setSort,
}: {
    headerData: AdminPageUserColumn;
    orderBy: OrderBy;
    isDesc: boolean;
    setSort: (isDesc?: boolean, orderBy?: OrderBy) => void;
}) {
    return (
        <div
            className="flex flex-row items-center justify-center gap-1 text-center font-bold hover:cursor-pointer"
            onClick={() => setSort(!isDesc, headerData.name)}
        >
            <div>{headerData.displayName}</div>
            {orderBy === headerData.name && (
                <div className={`flex items-center justify-center`}>
                    <Triangle type={isDesc ? "down" : "up"} />
                </div>
            )}
        </div>
    );
}
