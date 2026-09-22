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
        <div
            key={fileName}
            className="border-y-2 border-white flex-row flex justify-between p-3"
        >
            <div className="flex flex-row gap-10">
                <p>{fileName}</p>
                <p>{username}</p>
                <p>{uploadedAt.toLocaleString()}</p>
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
