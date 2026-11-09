import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UploadedFile } from "@/types/dashboard";
import { reviveUploadedFile, serializeUploadedFile } from "@/utils/endpoints";

/** uploadedAt 이 ISO 문자열인 저장/전달용 파일 형태 */
type SerializedFile = Omit<UploadedFile, "uploadedAt"> & {
    uploadedAt?: string;
};

/** 파일 메타데이터 스토어의 상태 및 액션 */
interface FileState {
    /** 회사 공용 파일 메타데이터 (key: companyId) */
    sharedFiles: Record<number, UploadedFile[]>;
    /** 사원 개별 업로드 파일 메타데이터 (key: employeeId) */
    personalFiles: Record<number, UploadedFile[]>;
    /**
     * 회사 공용 파일 목록을 교체합니다.
     * @param companyId 대상 회사 ID
     * @param files 저장할 파일 메타데이터 목록
     */
    setSharedFiles: (companyId: number, files: UploadedFile[]) => void;
    /**
     * 사원 개별 파일 목록을 교체합니다.
     * @param employeeId 대상 사원 ID
     * @param files 저장할 파일 메타데이터 목록
     */
    setPersonalFiles: (employeeId: number, files: UploadedFile[]) => void;
    /**
     * 사원 개별 파일 목록을 삭제합니다.
     * @param employeeId 삭제할 대상 사원 ID
     */
    removePersonalFiles: (employeeId: number) => void;
}

/** localStorage 저장 포맷 */
interface PersistedFileState {
    sharedFiles: Record<number, SerializedFile[]>;
    personalFiles: Record<number, SerializedFile[]>;
}

/**
 * 파일 맵의 각 항목을 저장용 형태로 변환합니다.
 * @param map 키별 파일 메타데이터 맵
 * @returns 날짜가 문자열로 변환된 저장용 파일 맵
 */
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

/**
 * 저장된 파일 맵을 런타임 형태(UploadedFile)로 복원합니다.
 * @param map 저장된 키별 파일 맵 (없을 수 있음)
 * @returns 복원된 키별 파일 메타데이터 맵
 */
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

/**
 * 파일 메타데이터 스토어 (localStorage `mes-files` 에 persist)
 * 저장 시 uploadedAt을 문자열로, 복원 시 다시 객체로 변환합니다.
 */
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
                    personalFiles: {
                        ...state.personalFiles,
                        [employeeId]: files,
                    },
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
