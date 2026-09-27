import { FileType, isFileType } from "@/types/fileType";
import { createStore } from "zustand";

/**
 * 파일의 필터링 데이터를 저장합니다.
 */
export type FileFilterState = {
    /**
     * 검색란에 사용자가 입력한 텍스트를 저장합니다.
     */
    queryText: string;
    /**
     * 사용자가 드롭다운에서 선택한 파일 유형을 저장합니다.
     */
    fileType: FileType;
    /**
     * 사용자가 선택한 시작일을 저장합니다.
     */
    createdAtStart: Temporal.PlainDateTime | undefined;
    /**
     * 사용자가 선택한 종료일을 저장합니다.
     */
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
