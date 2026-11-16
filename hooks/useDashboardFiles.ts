"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UploadedFile } from "@/types/dashboard";
import {
    deleteFile,
    fetchPersonalFiles,
    getStoredPersonalFiles,
    getStoredSharedFiles,
    setStoredPersonalFiles,
    uploadFiles,
} from "@/utils/dashboardApi";

interface UseDashboardFilesOptions {
    initialFiles: UploadedFile[];
    employeeId?: number;
    companyId?: number;
    handleApiError: (
        error: unknown,
        fallbackMessage: string,
        notify?: boolean,
    ) => Promise<boolean>;
}

/**
 * 대시보드 개인 파일 목록 복원, 서버 동기화, 업로드(중복 차단 모달 포함),
 * 삭제 및 로컬 스토리지 캐싱을 담당하는 훅입니다.
 */
export function useDashboardFiles({
    initialFiles,
    employeeId,
    companyId,
    handleApiError,
}: UseDashboardFilesOptions) {
    const [uploadedFiles, setUploadedFiles] =
        useState<UploadedFile[]>(initialFiles);
    const [isUploading, setIsUploading] = useState(false);
    const [duplicateFileModal, setDuplicateFileModal] = useState<
        string[] | null
    >(null);

    const uploadedFilesRef = useRef<UploadedFile[]>(initialFiles);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const storageHydratedRef = useRef(false);
    const skipNextPersistRef = useRef(false);
    const recentlyUploadedIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        uploadedFilesRef.current = uploadedFiles;
    }, [uploadedFiles]);

    // 사원번호/회사ID가 확인된 시점에 로컬 스토리지 복원 및 서버 개인 파일 동기화
    useEffect(() => {
        if (employeeId === undefined) return;
        let ignore = false;

        async function initializeFiles(empId: number, compId?: number) {
            await Promise.resolve();
            if (ignore) return;

            if (!storageHydratedRef.current) {
                try {
                    const parsed = getStoredPersonalFiles(empId);
                    if (parsed.length > 0) {
                        const sharedIds = new Set(
                            compId
                                ? getStoredSharedFiles(compId).map((f) => f.id)
                                : [],
                        );
                        setUploadedFiles((prev) => {
                            const existingIds = new Set(prev.map((f) => f.id));
                            return [
                                ...prev.filter(
                                    (f) => !f.shared && !sharedIds.has(f.id),
                                ),
                                ...parsed.filter(
                                    (f) =>
                                        !f.shared &&
                                        !sharedIds.has(f.id) &&
                                        !existingIds.has(f.id),
                                ),
                            ];
                        });
                    }
                } catch (error) {
                    console.error("로컬 파일 목록 복원 실패:", error);
                } finally {
                    storageHydratedRef.current = true;
                }
            }

            if (compId !== undefined) {
                try {
                    const serverPersonalFiles = await fetchPersonalFiles(
                        empId,
                        compId,
                    );
                    if (ignore) return;
                    setUploadedFiles((prev) => {
                        const serverIds = new Set(
                            serverPersonalFiles.map((f) => f.id),
                        );
                        const inFlightUploads = prev.filter(
                            (f) =>
                                !serverIds.has(f.id) &&
                                recentlyUploadedIdsRef.current.has(f.id),
                        );
                        return [...inFlightUploads, ...serverPersonalFiles];
                    });
                } catch {
                    // 오프라인 등 실패 시 로컬 상태 유지
                }
            }
        }

        void initializeFiles(employeeId, companyId);
        return () => {
            ignore = true;
        };
    }, [employeeId, companyId]);

    // 파일 목록 변경 시 로컬 스토리지 동기화
    useEffect(() => {
        if (!employeeId || !storageHydratedRef.current) return;
        if (skipNextPersistRef.current) {
            skipNextPersistRef.current = false;
            return;
        }
        try {
            setStoredPersonalFiles(employeeId, uploadedFiles);
        } catch {
            // 스토리지 용량 초과 등은 무시
        }
    }, [uploadedFiles, employeeId]);

    const handleOpenFilePicker = useCallback(() => {
        if (isUploading) return;
        fileInputRef.current?.click();
    }, [isUploading]);

    const handleFileUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            const selected = Array.from(files);
            e.target.value = "";

            const existingNameSet = new Set<string>(
                uploadedFilesRef.current.map((f) =>
                    f.name.trim().toLowerCase(),
                ),
            );
            const duplicateNames: string[] = [];
            const filesToUpload: File[] = [];

            for (const file of selected) {
                const normalizedName = file.name.trim().toLowerCase();
                if (existingNameSet.has(normalizedName)) {
                    duplicateNames.push(file.name);
                } else {
                    existingNameSet.add(normalizedName);
                    filesToUpload.push(file);
                }
            }

            if (duplicateNames.length > 0) {
                setDuplicateFileModal(duplicateNames);
            }

            if (filesToUpload.length === 0) {
                return;
            }

            setIsUploading(true);
            try {
                const { uploaded, failed } = await uploadFiles(filesToUpload);
                if (uploaded.length > 0) {
                    for (const item of uploaded) {
                        recentlyUploadedIdsRef.current.add(item.id);
                    }
                    setUploadedFiles((prev) => {
                        const mergedMap = new Map<string, UploadedFile>();
                        for (const item of uploaded) {
                            mergedMap.set(item.id, item);
                        }
                        for (const item of prev) {
                            if (!mergedMap.has(item.id)) {
                                mergedMap.set(item.id, item);
                            }
                        }
                        return Array.from(mergedMap.values());
                    });
                }
                if (failed.length > 0) {
                    const serverDuplicateNames = failed
                        .filter((f) => f.reason.includes("이미 업로드한 파일"))
                        .map((f) => f.name);
                    if (serverDuplicateNames.length > 0) {
                        setDuplicateFileModal((prev) =>
                            Array.from(
                                new Set([
                                    ...(prev ?? []),
                                    ...serverDuplicateNames,
                                ]),
                            ),
                        );
                    }
                    const nonDuplicateFailed = failed.filter(
                        (f) => !f.reason.includes("이미 업로드한 파일"),
                    );
                    if (nonDuplicateFailed.length > 0) {
                        const summary = nonDuplicateFailed
                            .map((f) => `- ${f.name}: ${f.reason}`)
                            .join("\n");
                        alert(`일부 파일 업로드에 실패했습니다.\n${summary}`);
                    }
                }
            } catch (error) {
                await handleApiError(
                    error,
                    "파일 업로드에 실패했습니다.",
                    true,
                );
            } finally {
                setIsUploading(false);
            }
        },
        [handleApiError],
    );

    const handleRemoveFile = useCallback(
        async (id: string) => {
            const index = uploadedFilesRef.current.findIndex(
                (file) => file.id === id,
            );
            if (index === -1) return;
            const removed = uploadedFilesRef.current[index];

            if (!confirm(`'${removed.name}' 파일을 삭제하시겠습니까?`)) return;

            recentlyUploadedIdsRef.current.delete(id);
            setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
            try {
                await deleteFile(id);
            } catch (error) {
                setUploadedFiles((prev) => {
                    if (prev.some((file) => file.id === id)) return prev;
                    const next = [...prev];
                    next.splice(Math.min(index, next.length), 0, removed);
                    return next;
                });
                await handleApiError(error, "파일 삭제에 실패했습니다.", true);
            }
        },
        [handleApiError],
    );

    const clearFileState = useCallback(() => {
        skipNextPersistRef.current = true;
        recentlyUploadedIdsRef.current.clear();
        setUploadedFiles([]);
        setDuplicateFileModal(null);
    }, []);

    return {
        uploadedFiles,
        isUploading,
        duplicateFileModal,
        setDuplicateFileModal,
        fileInputRef,
        handleOpenFilePicker,
        handleFileUpload,
        handleRemoveFile,
        clearFileState,
    };
}
