type FileData = {
    fileName: string;
    username: string;
    uploadedAt: Date;
};

export default function AdminPageFileEntry({
    fileName,
    username,
    uploadedAt,
}: FileData) {
    return (
        <div className="flex flex-row justify-between border-y-2 border-white p-3">
            <div className="flex flex-row gap-10">
                <p>{fileName}</p>
                <p>{username}</p>
                <p>{uploadedAt.toLocaleString()}</p>
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
