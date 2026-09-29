import { FileOrderBy } from "./fileMetadata";

export type AdminPageFileColumn = {
    name: FileOrderBy;
    displayName: string;
};

export const adminPageFileColumns: AdminPageFileColumn[] = [
    { name: "fileId", displayName: "파일 ID" },
    { name: "fileName", displayName: "파일명" },
    { name: "uploadedAt", displayName: "업로드일" },
    { name: "username", displayName: "사용자" },
];
