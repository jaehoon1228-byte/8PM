/**
 * 각 파일의 메타데이터를 정의합니다.
 */
export type FileMetadata = {
    /**
     * 파일의 일련번호.
     */
    fileId: string;
    /**
     * 파일의 이름.
     */
    fileName: string;
    /**
     * 파일을 업로드한 사용자명.
     */
    username: string;
    /**
     * 파일이 업로드된 날짜.
     */
    uploadedAt: Temporal.PlainDateTime;
};

export const fileProperties: (keyof FileMetadata)[] = [
    "fileId",
    "fileName",
    "username",
    "uploadedAt",
];
export type FileOrderBy = (typeof fileProperties)[number];
