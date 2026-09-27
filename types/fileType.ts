const avaliableFileTypes = [
    "",
    "pdf",
    "docx",
    "xlsx",
    "pptx",
    "csv",
    "pdf",
] as const;
/**
 * 사용자가 필터링할 때 사용할 수 있는 파일 유형들입니다.
 */
export type FileType = (typeof avaliableFileTypes)[number];
/**
 * 문자열이 올바른 {@link FileType}인지 확인합니다.
 * @param value {@link String}
 * @returns Boolean.
 */
export function isFileType(value: string): value is FileType {
    return avaliableFileTypes.includes(value as FileType);
}
