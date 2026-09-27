import { FileType, isFileType } from "@/types/fileType";
import { createStore } from "zustand";

export type FileFilterState = {
    queryText: string;
    fileType: FileType;
    createdAtStart: Temporal.PlainDateTime | undefined;
    createdAtEnd: Temporal.PlainDateTime | undefined;
};
export type FileFilterActions = {
    setQueryText: (value: string) => void;
    setFileType: (value: FileType) => void;
    setCreatedAt: (
        start?: Temporal.PlainDateTime,
        end?: Temporal.PlainDateTime,
    ) => void;
};

export type FileFilterStore = FileFilterState & FileFilterActions;

export const defaultInitState: FileFilterState = {
    queryText: "",
    fileType: "",
    createdAtStart: undefined,
    createdAtEnd: undefined,
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
        setCreatedAt: (start, end) =>
            set(() => {
                if (start && end) {
                    return { createdAtStart: start, createdAtEnd: end };
                } else if (start) {
                    return { createdAtStart: start };
                } else if (end) {
                    return { createdAtEnd: end };
                } else {
                    return {
                        createdAtStart: undefined,
                        createdAtEnd: undefined,
                    };
                }
            }),
    }));
}
