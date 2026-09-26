"use client";

import AdminPageFileEntry from "@/components/AdminPageFileEntry";
import AdminPageContent from "@/components/AdminPageContent";
import { FileMetadata } from "@/types/fileMetadata";
import { useFileFilterStore } from "@/providers/fileFilterProvider";
import { FileType } from "@/types/fileType";

export default function AdminFilePage() {
    const files: FileMetadata[] = [
        {
            fileId: crypto.randomUUID(),
            fileName: "test.docx",
            username: "admin",
            uploadedAt: new Date(2026, 0, 1, 0, 0, 0),
        },
    ];

    const { fileType, queryText, setFileType, setQueryText } =
        useFileFilterStore((state) => state);

    const changeFilter = ({
        fileType,
        queryText,
    }: {
        fileType?: FileType;
        queryText?: string;
    }) => {
        if (fileType) {
            setFileType(fileType);
        }
        setQueryText(queryText ?? "");
    };

    return (
        <AdminPageContent
            pageType="file"
            searchElement={
                <>
                    <input
                        type="text"
                        name="queryText"
                        className="flex-2 rounded-2xl border-2 border-white p-3"
                        placeholder="검색 시작하기..."
                        value={queryText}
                        onChange={(e) => {
                            changeFilter({ queryText: e.target.value });
                        }}
                    />
                    <select
                        name="fileType"
                        id="fileType"
                        className="flex-1 rounded-2xl border-2 border-white p-3"
                        value={fileType}
                        onChange={(e) => {
                            changeFilter({
                                fileType: e.target.value as FileType,
                            });
                        }}
                    >
                        <option value="">파일 유형 선택...</option>
                        <option value="docx">DOCX</option>
                        <option value="xlsx">XLSX</option>
                        <option value="pptx">PPTX</option>
                        <option value="CSV">CSV</option>
                        <option value="pdf">PDF</option>
                    </select>
                </>
            }
            contentElement={files
                .filter((value) => {
                    if (queryText || fileType) {
                        return fileType
                            ? value.fileName.includes(fileType)
                            : true &&
                                  (value.fileId === queryText ||
                                      value.fileName.includes(queryText) ||
                                      value.username.includes(queryText));
                    } else {
                        return true;
                    }
                })
                .map((value) => (
                    <AdminPageFileEntry key={value.fileId} {...value} />
                ))}
        />
    );
}
