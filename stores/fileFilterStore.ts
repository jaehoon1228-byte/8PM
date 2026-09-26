import { FileType, isFileType } from "@/types/fileType";
import { createStore } from "zustand";

export type FileFilterState = {
    queryText: string;
    fileType: FileType;
};
export type FileFilterActions = {
    setQueryText: (value: string) => void;
    setFileType: (value: FileType) => void;
};

export type FileFilterStore = FileFilterState & FileFilterActions;

export const defaultInitState: FileFilterState = {
    queryText: "",
    fileType: "",
};

export function createFileFilterStore(
    initState: FileFilterState = defaultInitState,
) {
    return createStore<FileFilterStore>()((set) => ({
        ...initState,
        setQueryText: (value) => set(() => ({ queryText: value })),
        setFileType: (value) =>
            set(() => {
                if (isFileType(value)) {
                    return { fileType: value };
                } else {
                    throw new Error("File Type이 올바르지 않습니다.");
                }
            }),
    }));
}
