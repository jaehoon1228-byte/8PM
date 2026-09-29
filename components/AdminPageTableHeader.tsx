import Triangle from "./Triangle";
import { AdminPageUserColumn } from "@/types/adminPageUserColumns";
import { AdminPageFileColumn } from "@/types/adminPageFileColumns";
import { FileOrderBy } from "@/types/fileMetadata";
import { UserOrderBy } from "@/types/user";

export default function AdminPageTableHeader({
    headerData,
    orderBy,
    isDesc,
    setSort,
}: {
    headerData: AdminPageUserColumn | AdminPageFileColumn;
    orderBy: FileOrderBy | UserOrderBy;
    isDesc: boolean;
    setSort: (
        newIsDesc?: boolean,
        newOrderBy?: FileOrderBy | UserOrderBy,
    ) => void;
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
