import { FileMetadata } from "@/types/fileMetadata";

export default function AdminPageFileEntry({
    fileId,
    fileName,
    username,
    uploadedAt,
    gridStyle,
}: FileMetadata & { gridStyle: string }) {
    return (
        <div
            className={`${gridStyle} grid items-center justify-center border-y-2 border-white p-3 text-center`}
        >
            <p>{fileId}</p>
            <p>{fileName}</p>
            <p>{uploadedAt.toLocaleString() ?? ""}</p>
            <p>{username}</p>
            <div
                tabIndex={0}
                className="font-bold text-red-700 hover:cursor-pointer"
            >
                삭제
            </div>
        </div>
    );
}
