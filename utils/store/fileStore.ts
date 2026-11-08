import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UploadedFile } from "@/types/dashboard";
import {
    reviveUploadedFile,
    serializeUploadedFile,
} from "@/utils/endpoints";

/** uploadedAt 이 ISO 문자열인 저장/전달용 파일 형태 */
type SerializedFile = Omit<UploadedFile, "uploadedAt"> & { uploadedAt?: string };

interface FileState {
    /** 회사 공용 파일 메타데이터 (key: companyId) */
    sharedFiles: Record<number, UploadedFile[]>;
    /** 사원 개별 업로드 파일 메타데이터 (key: employeeId) */
    personalFiles: Record<number, UploadedFile[]>;
    setSharedFiles: (companyId: number, files: UploadedFile[]) => void;
    setPersonalFiles: (employeeId: number, files: UploadedFile[]) => void;
    removePersonalFiles: (employeeId: number) => void;
}

/** localStorage 저장 포맷 */
interface PersistedFileState {
    sharedFiles: Record<number, SerializedFile[]>;
    personalFiles: Record<number, SerializedFile[]>;
}

function serializeFileMap(
    map: Record<number, UploadedFile[]>,
): Record<number, SerializedFile[]> {
    const result: Record<number, SerializedFile[]> = {};
    for (const key of Object.keys(map)) {
        const id = Number(key);
        result[id] = map[id].map(serializeUploadedFile);
    }
    return result;
}

function reviveFileMap(
    map?: Record<number, SerializedFile[]>,
): Record<number, UploadedFile[]> {
    const result: Record<number, UploadedFile[]> = {};
    for (const key of Object.keys(map ?? {})) {
        const id = Number(key);
        result[id] = (map?.[id] ?? []).map(reviveUploadedFile);
    }
    return result;
}

export const useFileStore = create<FileState>()(
    persist(
        (set) => ({
            sharedFiles: {},
            personalFiles: {},
            setSharedFiles: (companyId, files) =>
                set((state) => ({
                    sharedFiles: { ...state.sharedFiles, [companyId]: files },
                })),
            setPersonalFiles: (employeeId, files) =>
                set((state) => ({
                    personalFiles: { ...state.personalFiles, [employeeId]: files },
                })),
            removePersonalFiles: (employeeId) =>
                set((state) => {
                    const next = { ...state.personalFiles };
                    delete next[employeeId];
                    return { personalFiles: next };
                }),
        }),
        {
            name: "mes-files",
            storage: createJSONStorage(() => localStorage),
            partialize: (state): PersistedFileState => ({
                sharedFiles: serializeFileMap(state.sharedFiles),
                personalFiles: serializeFileMap(state.personalFiles),
            }),
            merge: (persisted, current) => {
                // JSON 파싱 결과는 타입이 없으므로 저장 포맷으로 단언
                const saved = persisted as PersistedFileState | undefined;
                return {
                    ...current,
                    sharedFiles: reviveFileMap(saved?.sharedFiles),
                    personalFiles: reviveFileMap(saved?.personalFiles),
                };
            },
        },
    ),
);
