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
            // uploadedAt: new Date(2026, 0, 1, 0, 0, 0),
            uploadedAt: new Temporal.PlainDateTime(2026, 1, 1),
        },
    ];

    const {
        fileType,
        queryText,
        createdAtStart,
        createdAtEnd,
        setFileType,
        setQueryText,
        setCreatedAt,
    } = useFileFilterStore((state) => state);

    const changeFilter = ({
        fileType,
        queryText,
        createdAtStart,
        createdAtEnd,
    }: {
        fileType?: FileType;
        queryText?: string;
        createdAtStart?: Temporal.PlainDateTime;
        createdAtEnd?: Temporal.PlainDateTime;
    }) => {
        if (fileType) {
            setFileType(fileType);
        } else {
            setFileType("");
        }
        setQueryText(queryText ?? "");
        setCreatedAt(createdAtStart, createdAtEnd);
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
                    <div className="flex flex-col gap-1 lg:flex-row">
                        <div className="flex flex-1 flex-row items-center justify-center gap-1">
                            <label
                                htmlFor="createdAtStart"
                                className="text-xs [writing-mode:vertical-rl]"
                            >
                                시작일
                            </label>
                            <input
                                className="flex-12 rounded-2xl border-2 border-white p-3"
                                type="date"
                                name="createdAtStart"
                                id="createdAtStart"
                                onChange={(e) => {
                                    try {
                                        changeFilter({
                                            createdAtStart:
                                                Temporal.PlainDateTime.from(
                                                    e.target.value,
                                                ),
                                        });
                                    } catch (err) {
                                        if (err instanceof RangeError) {
                                            changeFilter({
                                                createdAtStart: undefined,
                                            });
                                        } else {
                                            throw err;
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-1 flex-row items-center justify-center gap-1">
                            <label
                                htmlFor="createdAtEnd"
                                className="text-xs [writing-mode:vertical-rl]"
                            >
                                종료일
                            </label>
                            <input
                                className="flex-12 rounded-2xl border-2 border-white p-3"
                                type="date"
                                name="createdAtEnd"
                                id="createdAtEnd"
                                onChange={(e) => {
                                    try {
                                        changeFilter({
                                            createdAtEnd:
                                                Temporal.PlainDateTime.from(
                                                    e.target.value,
                                                ),
                                        });
                                    } catch (err) {
                                        if (err instanceof RangeError) {
                                            changeFilter({
                                                createdAtEnd: undefined,
                                            });
                                        } else {
                                            throw err;
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </>
            }
            contentElement={files
                .filter((value) => {
                    if (
                        queryText ||
                        fileType ||
                        createdAtStart ||
                        createdAtEnd
                    ) {
                        return fileType
                            ? value.fileName.includes(fileType)
                            : true &&
                                  (!createdAtStart ||
                                      Temporal.PlainDateTime.compare(
                                          value.uploadedAt,
                                          createdAtStart,
                                      ) >= 0) &&
                                  (!createdAtEnd ||
                                      Temporal.PlainDateTime.compare(
                                          value.uploadedAt,
                                          createdAtEnd,
                                      ) <= 0) &&
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
