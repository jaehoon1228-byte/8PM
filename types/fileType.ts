const avaliableFileTypes = [
    "",
    "pdf",
    "docx",
    "xlsx",
    "pptx",
    "csv",
    "pdf",
] as const;
export type FileType = (typeof avaliableFileTypes)[number];
export function isFileType(value: string): value is FileType {
    return avaliableFileTypes.includes(value as FileType);
}
