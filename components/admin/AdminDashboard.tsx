"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    ChevronDown,
    ChevronUp,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    IdCard,
    Loader2,
    Lock,
    Mail,
    Plus,
    RefreshCw,
    Search,
    Shield,
    ShieldCheck,
    Trash2,
    Upload,
    User,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import type {
    AdminInitialData,
    JoinRequestDto,
    UploadedFile,
    UserInfo,
} from "@/types/dashboard";
import {
    createAdminUser,
    deleteAdminUser,
    deleteFile,
    extractErrorMessage,
    fetchAdminUsers,
    fetchAllCompanyFilesByEmployeeMap,
    fetchCompanySharedFiles,
    fetchUserPersonalFilesForAdmin,
    getStoredPersonalFiles,
    getStoredSharedFiles,
    isSessionExpired,
    setStoredPersonalFiles,
    setStoredSharedFiles,
    uploadFiles,
} from "@/utils/dashboardApi";
import {
    reviveUploadedFile,
    reviveUploadedFileMap,
    toUserInfo,
} from "@/utils/endpoints";
import {
    formatCreatedDate,
    formatRoleLabel,
    isManagerOrAbove,
} from "@/utils/preferences";

interface AdminDashboardProps {
    userInfo: NonNullable<AdminInitialData["userInfo"]>;
    initialData?: AdminInitialData;
}

type ConfirmModalState =
    | {
          type: "delete-user";
          targetUser: UserInfo;
      }
    | {
          type: "delete-user-file";
          employeeId: number;
          employeeName: string;
          file: UploadedFile;
      }
    | {
          type: "delete-shared-file";
          file: UploadedFile;
      }
    | null;

const PASSWORD_REGEX =
    /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*#?&])[A-Za-z0-9@$!%*#?&]{8,20}$/;
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "xlsx", "pptx", "csv"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function validateUploadFiles(files: File[]): string | null {
    for (const file of files) {
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            return `'${file.name}': 지원하지 않는 확장자입니다. (PDF, DOCX, XLSX, PPTX, CSV만 가능)`;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return `'${file.name}': 파일 크기는 10MB를 초과할 수 없습니다.`;
        }
    }
    return null;
}

export default function AdminDashboard({
    userInfo,
    initialData,
}: AdminDashboardProps) {
    const router = useRouter();
    const sharedFileInputRef = useRef<HTMLInputElement>(null);
    const userFileInputRef = useRef<HTMLInputElement>(null);

    const isMaster = String(userInfo.role).includes("MASTER");
    const [selectedCompanyId, setSelectedCompanyId] = useState<number>(
        userInfo.companyId,
    );
    const activeCompanyId = isMaster ? selectedCompanyId : userInfo.companyId;

    // -------------------- 1. 맨 위: 공용 데이터 파일 상태 (SSR 초기값 우선) --
    const [sharedFiles, setSharedFiles] = useState<UploadedFile[]>(
        initialData?.sharedFiles?.map(reviveUploadedFile) ?? [],
    );
    const [sharedSearchQuery, setSharedSearchQuery] = useState("");
    const [isLoadingShared, setIsLoadingShared] = useState(
        initialData?.sharedFiles === null ||
            initialData?.sharedFiles === undefined,
    );
    const [isUploadingShared, setIsUploadingShared] = useState(false);

    // -------------------- 2. 밑: 사원 목록 & 개별 파일 토글 상태 (SSR 초기값 우선)
    const [allFetchedUsers, setAllFetchedUsers] = useState<UserInfo[]>(
        initialData?.companyUsers?.map(toUserInfo) ?? [],
    );
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [isLoadingUsers, setIsLoadingUsers] = useState(
        initialData?.companyUsers === null ||
            initialData?.companyUsers === undefined,
    );

    // 등록된 회사일련번호 목록 도출 (최고관리자 ROLE_MASTER 전용 회사 코드 선택용)
    const registeredCompanies = useMemo(() => {
        const companyMap = new Map<
            number,
            { companyId: number; companyName: string; userCount: number }
        >();

        companyMap.set(userInfo.companyId, {
            companyId: userInfo.companyId,
            companyName: userInfo.companyName ?? `회사 #${userInfo.companyId}`,
            userCount: 0,
        });

        for (const u of allFetchedUsers) {
            // 최고관리자(ROLE_MASTER) 계정은 회사별 등록 사원 수에서 제외
            const countDelta = String(u.role).includes("MASTER") ? 0 : 1;
            const existing = companyMap.get(u.companyId);
            if (existing) {
                existing.userCount += countDelta;
                if (
                    u.companyName &&
                    existing.companyName.startsWith("회사 #")
                ) {
                    existing.companyName = u.companyName;
                }
            } else {
                companyMap.set(u.companyId, {
                    companyId: u.companyId,
                    companyName: u.companyName ?? `회사 #${u.companyId}`,
                    userCount: countDelta,
                });
            }
        }

        return Array.from(companyMap.values()).sort(
            (a, b) => a.companyId - b.companyId,
        );
    }, [allFetchedUsers, userInfo.companyId, userInfo.companyName]);

    const activeCompanyName = useMemo(() => {
        const found = registeredCompanies.find(
            (c) => c.companyId === activeCompanyId,
        );
        return (
            found?.companyName ??
            (activeCompanyId === userInfo.companyId
                ? userInfo.companyName
                : undefined) ??
            `회사 #${activeCompanyId}`
        );
    }, [
        registeredCompanies,
        activeCompanyId,
        userInfo.companyId,
        userInfo.companyName,
    ]);

    // 현재 선택된 회사일련번호(activeCompanyId)에 속한 유저 목록
    // (로그인 권한과 관계없이 최고관리자(ROLE_MASTER) 계정은 사용자 목록에 노출하지 않음)
    const companyUsers = useMemo(
        () =>
            allFetchedUsers.filter(
                (u) =>
                    u.companyId === activeCompanyId &&
                    !String(u.role).includes("MASTER"),
            ),
        [allFetchedUsers, activeCompanyId],
    );

    // 펼쳐진 유저 사번 Set 및 사원별 개별 파일 목록 맵
    const [expandedEmployeeIds, setExpandedEmployeeIds] = useState<Set<number>>(
        new Set(),
    );
    const [userFilesMap, setUserFilesMap] = useState<
        Record<number, UploadedFile[]>
    >(initialData?.userFilesMap ? reviveUploadedFileMap(initialData.userFilesMap) : {});
    const [loadingUserFilesIds, setLoadingUserFilesIds] = useState<Set<number>>(
        new Set(),
    );
    const [uploadingTargetEmpId, setUploadingTargetEmpId] = useState<
        number | null
    >(null);

    // -------------------- 3. 계정 생성 모달 상태 -----------------------------
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [isSubmittingUser, setIsSubmittingUser] = useState(false);
    const [createFormError, setCreateFormError] = useState<string | null>(null);
    const [newAccountForm, setNewAccountForm] = useState({
        employeeId: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // -------------------- 4. 예/아니오 삭제 확인 경고 모달 및 중복 파일 안내 모달 상태 --------------
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);
    const [isProcessingDelete, setIsProcessingDelete] = useState(false);
    const [duplicateFileModal, setDuplicateFileModal] = useState<{
        title: string;
        description: string;
        names: string[];
    } | null>(null);

    // 상단 알림 배너
    const [feedbackBanner, setFeedbackBanner] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const showFeedback = useCallback(
        (type: "success" | "error", message: string) => {
            setFeedbackBanner({ type, message });
        },
        [],
    );

    useEffect(() => {
        if (!feedbackBanner) return;
        const timer = setTimeout(() => setFeedbackBanner(null), 4000);
        return () => clearTimeout(timer);
    }, [feedbackBanner]);

    // 공용 데이터 파일 목록 조회 (현재 선택된 회사일련번호 activeCompanyId 기준)
    const loadSharedFiles = useCallback(async () => {
        setIsLoadingShared(true);
        try {
            const list = await fetchCompanySharedFiles(activeCompanyId);
            setSharedFiles(list);
        } catch (error) {
            if (isSessionExpired(error)) {
                router.push("/login");
                return;
            }
            const msg = await extractErrorMessage(
                error,
                "공용 데이터 파일 목록을 불러오지 못했습니다.",
            );
            showFeedback("error", msg);
        } finally {
            setIsLoadingShared(false);
        }
    }, [activeCompanyId, router, showFeedback]);

    // 유저 목록 조회 (GET /api/v1/users) + 현재 선택된 회사의 사원별 파일 맵 동기화
    const loadCompanyUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const allUsers = await fetchAdminUsers();
            setAllFetchedUsers(allUsers);
            const sameCompanyUsers = allUsers.filter(
                (u) => u.companyId === activeCompanyId,
            );

            const filesByEmployee = await fetchAllCompanyFilesByEmployeeMap(
                activeCompanyId,
                sameCompanyUsers.map((u) => u.employeeId),
            );
            setUserFilesMap(filesByEmployee);
        } catch (error) {
            if (isSessionExpired(error)) {
                router.push("/login");
                return;
            }
            const msg = await extractErrorMessage(
                error,
                "사원 목록을 불러오지 못했습니다.",
            );
            showFeedback("error", msg);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [activeCompanyId, router, showFeedback]);

    // 최고관리자(ROLE_MASTER)가 회사일련번호 코드를 클릭했을 때 해당 회사 데이터로 전환
    const handleSelectCompany = (targetCompId: number) => {
        if (targetCompId === selectedCompanyId) return;
        setSelectedCompanyId(targetCompId);
        setExpandedEmployeeIds(new Set());
        setSharedSearchQuery("");
        setUserSearchQuery("");
        setSharedFiles(getStoredSharedFiles(targetCompId));
        setIsLoadingShared(true);
    };

    useEffect(() => {
        if (!isManagerOrAbove(userInfo.role)) {
            router.replace("/");
            return;
        }

        let cancelled = false;
        void fetchCompanySharedFiles(activeCompanyId)
            .then((list) => {
                if (cancelled) return;
                setSharedFiles(
                    list.map((item) => ({
                        ...item,
                        shared: true,
                        companyId: activeCompanyId,
                    })),
                );
            })
            .catch(async (error) => {
                if (isSessionExpired(error)) {
                    router.push("/login");
                    return;
                }
                const msg = await extractErrorMessage(
                    error,
                    "공용 데이터 파일 목록을 불러오지 못했습니다.",
                );
                if (!cancelled) showFeedback("error", msg);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingShared(false);
            });

        void fetchAdminUsers()
            .then(async (allUsers) => {
                if (cancelled) return;
                setAllFetchedUsers(allUsers);
                const sameCompanyUsers = allUsers.filter(
                    (u) => u.companyId === activeCompanyId,
                );
                const filesByEmployee = await fetchAllCompanyFilesByEmployeeMap(
                    activeCompanyId,
                    sameCompanyUsers.map((u) => u.employeeId),
                );
                if (!cancelled) {
                    setUserFilesMap(filesByEmployee);
                }
            })
            .catch(async (error) => {
                if (isSessionExpired(error)) {
                    router.push("/login");
                    return;
                }
                const msg = await extractErrorMessage(
                    error,
                    "사원 목록을 불러오지 못했습니다.",
                );
                if (!cancelled) showFeedback("error", msg);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingUsers(false);
            });

        return () => {
            cancelled = true;
        };
    }, [activeCompanyId, userInfo.role, router, showFeedback]);

    // 유저 토글 클릭 시: 해당 유저의 AI 대화용 개별 업로드 파일 목록 펼치기/접기
    const handleToggleUserFiles = async (employeeId: number) => {
        const nextExpanded = new Set(expandedEmployeeIds);
        if (nextExpanded.has(employeeId)) {
            nextExpanded.delete(employeeId);
            setExpandedEmployeeIds(nextExpanded);
            return;
        }

        nextExpanded.add(employeeId);
        setExpandedEmployeeIds(nextExpanded);

        setLoadingUserFilesIds((prev) => new Set(prev).add(employeeId));
        try {
            const files = await fetchUserPersonalFilesForAdmin(
                employeeId,
                activeCompanyId,
            );
            setUserFilesMap((prev) => ({
                ...prev,
                [employeeId]: files,
            }));
        } finally {
            setLoadingUserFilesIds((prev) => {
                const updated = new Set(prev);
                updated.delete(employeeId);
                return updated;
            });
        }
    };

    // 공용 데이터 파일 업로드 (POST /api/v1/files?shared=true)
    const handleSharedFileSelect = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        const selected = Array.from(fileList);
        e.target.value = "";

        const validationError = validateUploadFiles(selected);
        if (validationError) {
            showFeedback("error", validationError);
            return;
        }

        // 중복 파일 검사: 현재 화면의 sharedFiles 및 로컬 스토리지의 공용 파일 목록과 파일명 비교
        const storedShared = getStoredSharedFiles(activeCompanyId);
        const existingNameSet = new Set<string>(
            [...sharedFiles, ...storedShared].map((f) =>
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
            setDuplicateFileModal({
                title: "이미 존재하는 파일입니다.",
                description:
                    "동일한 이름의 공용 데이터 파일이 이미 등록되어 있어 중복 파일은 업로드되지 않았습니다.",
                names: duplicateNames,
            });
            showFeedback(
                "error",
                `이미 존재하는 파일입니다: ${duplicateNames.join(", ")}`,
            );
        }

        // 모든 선택 파일이 중복 파일이면 업로드를 진행하지 않고 즉시 종료
        if (filesToUpload.length === 0) {
            return;
        }

        setIsUploadingShared(true);
        try {
            const { uploaded, failed } = await uploadFiles(
                filesToUpload,
                true,
                undefined,
                activeCompanyId,
            );
            if (uploaded.length > 0) {
                setSharedFiles((prev) => {
                    const stored = getStoredSharedFiles(activeCompanyId);
                    const mergedMap = new Map<string, UploadedFile>();

                    for (const item of uploaded) {
                        mergedMap.set(item.id, { ...item, shared: true });
                    }
                    for (const item of prev) {
                        if (!mergedMap.has(item.id)) {
                            mergedMap.set(item.id, { ...item, shared: true });
                        }
                    }
                    for (const item of stored) {
                        if (!mergedMap.has(item.id)) {
                            mergedMap.set(item.id, { ...item, shared: true });
                        }
                    }

                    const merged = Array.from(mergedMap.values());
                    setStoredSharedFiles(activeCompanyId, merged);
                    return merged;
                });
                showFeedback(
                    "success",
                    `회사일련번호 ${activeCompanyId} 공용 데이터 파일 ${uploaded.length}건이 업로드 및 파싱 완료되었습니다. 해당 회사 모든 유저의 AI 대화에 자동 반영됩니다.`,
                );
            }
            if (failed.length > 0) {
                const serverDuplicateNames = failed
                    .filter((f) => f.reason.includes("이미 존재하는 파일"))
                    .map((f) => f.name);
                if (serverDuplicateNames.length > 0) {
                    setDuplicateFileModal((prev) => ({
                        title: "이미 존재하는 파일입니다.",
                        description:
                            "동일한 이름의 공용 데이터 파일이 이미 등록되어 있어 중복 파일은 업로드되지 않았습니다.",
                        names: Array.from(
                            new Set([
                                ...(prev?.names ?? []),
                                ...serverDuplicateNames,
                            ]),
                        ),
                    }));
                }
                showFeedback(
                    "error",
                    failed.map((f) => `${f.name}: ${f.reason}`).join(" / "),
                );
            }
        } catch (error) {
            const msg = await extractErrorMessage(
                error,
                "공용 데이터 파일 업로드 중 오류가 발생했습니다.",
            );
            showFeedback("error", msg);
        } finally {
            setIsUploadingShared(false);
        }
    };

    // 특정 사용자의 개별 파일 추가 업로드 (POST /api/v1/files?shared=false&targetEmployeeId=...)
    const handleTriggerUserFileUpload = (employeeId: number) => {
        setUploadingTargetEmpId(employeeId);
        userFileInputRef.current?.click();
    };

    const handleUserFileSelect = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const fileList = e.target.files;
        const targetEmpId = uploadingTargetEmpId;
        if (!fileList || fileList.length === 0 || targetEmpId === null) return;
        const selected = Array.from(fileList);
        e.target.value = "";

        const validationError = validateUploadFiles(selected);
        if (validationError) {
            showFeedback("error", validationError);
            setUploadingTargetEmpId(null);
            return;
        }

        // 개별 파일 중복 검사: 해당 사원의 현재 개별 파일(userFilesMap) 및 로컬 스토리지 목록과 파일명 비교
        const currentPersonal = userFilesMap[targetEmpId] ?? [];
        const storedPersonal = getStoredPersonalFiles(targetEmpId);
        const existingPersonalNameSet = new Set<string>(
            [...currentPersonal, ...storedPersonal].map((f) =>
                f.name.trim().toLowerCase(),
            ),
        );

        const duplicateNames: string[] = [];
        const filesToUpload: File[] = [];

        for (const file of selected) {
            const normalizedName = file.name.trim().toLowerCase();
            if (existingPersonalNameSet.has(normalizedName)) {
                duplicateNames.push(file.name);
            } else {
                existingPersonalNameSet.add(normalizedName);
                filesToUpload.push(file);
            }
        }

        if (duplicateNames.length > 0) {
            setDuplicateFileModal({
                title: "이미 업로드한 파일이 존재합니다.",
                description:
                    "해당 사용자에게 동일한 이름의 개별 파일이 이미 업로드되어 있어 중복 파일은 업로드되지 않았습니다.",
                names: duplicateNames,
            });
            showFeedback(
                "error",
                `이미 업로드한 파일이 존재합니다: ${duplicateNames.join(", ")}`,
            );
        }

        // 선택한 모든 파일이 중복이면 업로드를 진행하지 않고 즉시 종료
        if (filesToUpload.length === 0) {
            setUploadingTargetEmpId(null);
            return;
        }

        setLoadingUserFilesIds((prev) => new Set(prev).add(targetEmpId));
        try {
            const { uploaded, failed } = await uploadFiles(
                filesToUpload,
                false,
                targetEmpId,
                activeCompanyId,
            );
            if (uploaded.length > 0) {
                setUserFilesMap((prev) => {
                    const current = prev[targetEmpId] ?? [];
                    const stored = getStoredPersonalFiles(targetEmpId);
                    const mergedMap = new Map<string, UploadedFile>();

                    for (const item of uploaded) {
                        mergedMap.set(item.id, {
                            ...item,
                            shared: false,
                            employeeId: targetEmpId,
                        });
                    }
                    for (const item of current) {
                        if (!mergedMap.has(item.id)) {
                            mergedMap.set(item.id, {
                                ...item,
                                shared: false,
                                employeeId: targetEmpId,
                            });
                        }
                    }
                    for (const item of stored) {
                        if (!mergedMap.has(item.id)) {
                            mergedMap.set(item.id, {
                                ...item,
                                shared: false,
                                employeeId: targetEmpId,
                            });
                        }
                    }

                    const updated = Array.from(mergedMap.values());
                    setStoredPersonalFiles(targetEmpId, updated);
                    return {
                        ...prev,
                        [targetEmpId]: updated,
                    };
                });
                showFeedback(
                    "success",
                    `사번 ${targetEmpId} 사용자의 개별 파일 ${uploaded.length}건이 추가되었습니다.`,
                );
            }
            if (failed.length > 0) {
                const serverDuplicateNames = failed
                    .filter(
                        (f) =>
                            f.reason.includes("이미 업로드한 파일") ||
                            f.reason.includes("이미 존재하는 파일"),
                    )
                    .map((f) => f.name);
                if (serverDuplicateNames.length > 0) {
                    setDuplicateFileModal((prev) => ({
                        title: "이미 업로드한 파일이 존재합니다.",
                        description:
                            "해당 사용자에게 동일한 이름의 개별 파일이 이미 업로드되어 있어 중복 파일은 업로드되지 않았습니다.",
                        names: Array.from(
                            new Set([
                                ...(prev?.names ?? []),
                                ...serverDuplicateNames,
                            ]),
                        ),
                    }));
                }
                showFeedback(
                    "error",
                    failed.map((f) => `${f.name}: ${f.reason}`).join(" / "),
                );
            }
        } catch (error) {
            const msg = await extractErrorMessage(
                error,
                "개별 파일 업로드에 실패했습니다.",
            );
            showFeedback("error", msg);
        } finally {
            setLoadingUserFilesIds((prev) => {
                const updated = new Set(prev);
                updated.delete(targetEmpId);
                return updated;
            });
            setUploadingTargetEmpId(null);
        }
    };

    // 삭제 경고 모달에서 [예] 클릭 시 처리
    const handleConfirmDelete = async () => {
        if (!confirmModal) return;
        setIsProcessingDelete(true);

        try {
            if (confirmModal.type === "delete-user") {
                const targetEmpId = confirmModal.targetUser.employeeId;
                const targetCompId = confirmModal.targetUser.companyId;
                await deleteAdminUser(targetEmpId);
                setAllFetchedUsers((prev) =>
                    prev.filter(
                        (u) =>
                            !(
                                u.companyId === targetCompId &&
                                u.employeeId === targetEmpId
                            ),
                    ),
                );
                setUserFilesMap((prev) => {
                    const next = { ...prev };
                    delete next[targetEmpId];
                    return next;
                });
                setExpandedEmployeeIds((prev) => {
                    const next = new Set(prev);
                    next.delete(targetEmpId);
                    return next;
                });
                showFeedback(
                    "success",
                    `${confirmModal.targetUser.username}(사번: ${targetEmpId}) 계정이 삭제되었습니다.`,
                );
            } else if (confirmModal.type === "delete-user-file") {
                const { employeeId, file } = confirmModal;
                await deleteFile(file.id);
                setUserFilesMap((prev) => {
                    const current = prev[employeeId] ?? [];
                    const updated = current.filter((f) => f.id !== file.id);
                    setStoredPersonalFiles(employeeId, updated);
                    return {
                        ...prev,
                        [employeeId]: updated,
                    };
                });
                showFeedback(
                    "success",
                    `'${file.name}' 파일이 삭제되었습니다.`,
                );
            } else if (confirmModal.type === "delete-shared-file") {
                const { file } = confirmModal;
                await deleteFile(file.id);
                setSharedFiles((prev) => {
                    const updated = prev.filter((f) => f.id !== file.id);
                    setStoredSharedFiles(activeCompanyId, updated);
                    return updated;
                });
                showFeedback(
                    "success",
                    `공용 데이터 파일 '${file.name}'이(가) 삭제되었습니다.`,
                );
            }
            setConfirmModal(null);
        } catch (error) {
            const msg = await extractErrorMessage(
                error,
                "삭제 처리 중 오류가 발생했습니다.",
            );
            showFeedback("error", msg);
            setConfirmModal(null);
        } finally {
            setIsProcessingDelete(false);
        }
    };

    // 하위관리자(ROLE_USER) 계정 생성 처리 (POST /api/v1/users)
    const handleCreateAccountSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setCreateFormError(null);

        const empIdNum = Number(newAccountForm.employeeId.trim());
        if (
            !newAccountForm.employeeId.trim() ||
            Number.isNaN(empIdNum) ||
            empIdNum <= 0
        ) {
            setCreateFormError("유효한 사원번호(숫자)를 입력해주세요.");
            return;
        }
        if (!newAccountForm.username.trim()) {
            setCreateFormError("사원 이름을 입력해주세요.");
            return;
        }
        if (
            !newAccountForm.email.trim() ||
            !newAccountForm.email.includes("@")
        ) {
            setCreateFormError("유효한 사내 이메일 형식을 입력해주세요.");
            return;
        }
        if (!PASSWORD_REGEX.test(newAccountForm.password)) {
            setCreateFormError(
                "비밀번호는 8~20자리이며, 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.",
            );
            return;
        }
        if (newAccountForm.password !== newAccountForm.confirmPassword) {
            setCreateFormError(
                "비밀번호와 비밀번호 재입력이 일치하지 않습니다.",
            );
            return;
        }

        const payload: JoinRequestDto = {
            companyId: activeCompanyId, // 현재 선택된(또는 본인) 회사일련번호 고정
            employeeId: empIdNum,
            username: newAccountForm.username.trim(),
            email: newAccountForm.email.trim(),
            password: newAccountForm.password,
            role: "ROLE_USER", // 하위관리자(일반 사용자) 권한 고정
        };

        setIsSubmittingUser(true);
        try {
            await createAdminUser(payload);
            setIsCreateUserOpen(false);
            setNewAccountForm({
                employeeId: "",
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
            });
            showFeedback(
                "success",
                `${payload.username}(사번: ${payload.employeeId}) 하위관리자 계정이 생성되었습니다.`,
            );
            await loadCompanyUsers();
        } catch (error) {
            const msg = await extractErrorMessage(
                error,
                "계정 생성에 실패했습니다.",
            );
            setCreateFormError(msg);
        } finally {
            setIsSubmittingUser(false);
        }
    };

    // 검색 필터링: 1) 공용 데이터 파일 검색 (useMemo 최적화)
    const filteredSharedFiles = useMemo(() => {
        const q = sharedSearchQuery.trim().toLowerCase();
        if (!q) return sharedFiles;
        return sharedFiles.filter(
            (file) =>
                file.name.toLowerCase().includes(q) ||
                file.size.toLowerCase().includes(q),
        );
    }, [sharedFiles, sharedSearchQuery]);

    // 검색 필터링: 2) 사용자 검색 (useMemo 최적화)
    const filteredUsers = useMemo(() => {
        const q = userSearchQuery.trim().toLowerCase();
        if (!q) return companyUsers;
        return companyUsers.filter(
            (member) =>
                member.username.toLowerCase().includes(q) ||
                String(member.employeeId).includes(q) ||
                member.email.toLowerCase().includes(q) ||
                formatRoleLabel(member.role).toLowerCase().includes(q),
        );
    }, [companyUsers, userSearchQuery]);

    const roleName = formatRoleLabel(userInfo.role);

    return (
        <div className="min-h-screen bg-slate-100/80 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors pb-16">
            {/* 숨김 파일 인풋: 1) 공용 데이터 파일 업로드용 2) 사원별 개별 파일 업로드용 */}
            <input
                ref={sharedFileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx,.pptx,.csv"
                className="hidden"
                onChange={handleSharedFileSelect}
            />
            <input
                ref={userFileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx,.pptx,.csv"
                className="hidden"
                onChange={handleUserFileSelect}
            />

            {/* 상단 네비게이션 헤더 */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="메인 대시보드로 돌아가기"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>메인페이지로 이동</span>
                        </button>
                        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-sm">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    MES 관리자 페이지
                                </h1>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                                    {userInfo.companyName ?? "소속 회사"}{" "}
                                    (회사일련번호: {userInfo.companyId})
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                {userInfo.username} 님
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                사번: {userInfo.employeeId}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/70 dark:border-indigo-800/60">
                            <Shield className="w-3.5 h-3.5" />
                            {roleName}
                        </span>
                    </div>
                </div>
            </header>

            {/* 본문 컨텐츠 영역 */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
                {/* 상태 피드백 토스트 배너 */}
                {feedbackBanner && (
                    <div
                        className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border shadow-sm text-sm font-semibold transition-all ${
                            feedbackBanner.type === "success"
                                ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                                : "bg-rose-50/90 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                        }`}
                    >
                        <span>{feedbackBanner.message}</span>
                        <button
                            type="button"
                            onClick={() => setFeedbackBanner(null)}
                            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ===================================================================
                    [최고관리자 전용 구역] 0. 등록된 회사일련번호 코드 목록 조회 및 선택
                =================================================================== */}
                {isMaster && (
                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 shadow-lg shadow-indigo-900/5 overflow-hidden">
                        <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-indigo-50/80 via-white to-violet-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    {/* <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                      <Shield className="w-3 h-3" />
                      ROLE_MASTER 전용
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      전체 테넌트 통합 관리
                    </span>
                  </div> */}
                                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        <span>
                                            등록된 회사일련번호 코드 목록
                                        </span>
                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                                            총 {registeredCompanies.length}개
                                            회사
                                        </span>
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        조회할 회사일련번호 코드를 클릭하면 해당
                                        회사의 공용 데이터 파일 목록과 소속
                                        사용자 목록으로 즉시 전환됩니다.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void loadCompanyUsers()}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer self-start md:self-auto shrink-0"
                                    title="등록된 회사 및 전체 사용자 목록 새로고침"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>회사 목록 새로고침</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {registeredCompanies.map((company) => {
                                    const isSelected =
                                        company.companyId === activeCompanyId;
                                    return (
                                        <button
                                            key={company.companyId}
                                            type="button"
                                            onClick={() =>
                                                handleSelectCompany(
                                                    company.companyId,
                                                )
                                            }
                                            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                isSelected
                                                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                                                    : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div
                                                    className={`p-3 rounded-xl shrink-0 transition-colors ${
                                                        isSelected
                                                            ? "bg-indigo-600 text-white shadow-xs"
                                                            : "bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                                    }`}
                                                >
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                                                                isSelected
                                                                    ? "bg-indigo-600 text-white"
                                                                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                            }`}
                                                        >
                                                            사번:{" "}
                                                            {company.companyId}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                                                선택됨
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1.5 truncate">
                                                        {company.companyName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                        등록된 사원:{" "}
                                                        <strong className="text-slate-700 dark:text-slate-200">
                                                            {company.userCount}
                                                            명
                                                        </strong>
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===================================================================
                    [맨 위 구역] 1. 전사 공용 데이터 파일 목록 · 검색 · 추가 · 삭제
                =================================================================== */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 overflow-hidden">
                    <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-indigo-50/60 via-white to-violet-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                {/* <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    회사일련번호 {activeCompanyId} ({activeCompanyName}) 공용
                    문서
                  </span>
                </div> */}
                                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                                    <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <span>공용 문서 관리</span>
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        총 {sharedFiles.length}건
                                    </span>
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <span className="block">
                                        업로드한 공용 데이터 파일은 자동
                                        파싱되어 같은 회사 모든 사용자의 AI
                                        대화에 자동 참조되며,
                                    </span>
                                    <span className="block mt-0.5">
                                        하위관리자의 메인페이지 파일 목록에는
                                        노출되지 않습니다.
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => loadSharedFiles()}
                                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                    title="공용 파일 목록 새로고침"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={isUploadingShared}
                                    onClick={() =>
                                        sharedFileInputRef.current?.click()
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer"
                                >
                                    {isUploadingShared ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>업로드 중...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            <span>공용 문서 업로드</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 공용 데이터 파일 검색창 */}
                        <div className="mt-5 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={sharedSearchQuery}
                                onChange={(e) =>
                                    setSharedSearchQuery(e.target.value)
                                }
                                placeholder="공용 데이터 파일명 또는 확장자(PDF, DOCX, XLSX, CSV 등) 검색..."
                                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition"
                            />
                            {sharedSearchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSharedSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 공용 데이터 파일 리스트 */}
                    <div className="p-6">
                        {isLoadingShared ? (
                            <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                <p className="text-xs font-medium">
                                    공용 데이터 파일 목록을 불러오는 중입니다...
                                </p>
                            </div>
                        ) : filteredSharedFiles.length === 0 ? (
                            <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <FileText className="w-9 h-9 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    {sharedSearchQuery
                                        ? `'${sharedSearchQuery}' 검색 결과에 해당하는 공용 파일이 없습니다.`
                                        : "등록된 공용 데이터 파일이 없습니다."}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    우측 상단 &apos;공용 데이터 파일 추가&apos;
                                    버튼을 눌러 전사 AI 공용 문서를
                                    업로드하세요.
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-72 sm:max-h-80 overflow-y-auto pr-1.5 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredSharedFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition group"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0 pr-3">
                                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0">
                                                    <FileSpreadsheet className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                            {file.name}
                                                        </p>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shrink-0">
                                                            공용
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        <span>
                                                            {file.size ||
                                                                "문서"}
                                                        </span>
                                                        {file.uploadedAt && (
                                                            <>
                                                                <span>·</span>
                                                                <span>
                                                                    {formatCreatedDate(
                                                                        file.uploadedAt,
                                                                    )}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirmModal({
                                                        type: "delete-shared-file",
                                                        file,
                                                    })
                                                }
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 transition shrink-0 cursor-pointer"
                                                title="공용 데이터 파일 삭제"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>삭제</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ===================================================================
                    [밑 구역] 2. 본인 회사 사용자(사원) 목록 · 검색 · 계정 추가 · 삭제
                              & 각 사용자별 AI 대화 개별 파일 토글 조회 · 추가 · 삭제
                =================================================================== */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 overflow-hidden">
                    <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                {/* <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                        회사코드 {activeCompanyId} (
                                        {activeCompanyName}) 소속
                                    </span>
                                </div> */}
                                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <span>
                                        사내 사용자 및 개별 업로드 파일 관리
                                    </span>
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        총 {companyUsers.length}명
                                    </span>
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    선택된 회사 소속 사용자 목록을 관리하며, 각
                                    사용자의 토글 버튼을 클릭하면 해당 사용자가{" "}
                                    <br />
                                    메인페이지에서 AI와 대화에 사용하는 개별
                                    파일 목록을 조회·추가·삭제할 수 있습니다.
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => void loadCompanyUsers()}
                                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                    title="사원 목록 새로고침"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreateFormError(null);
                                        setIsCreateUserOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span>계정 생성</span>
                                </button>
                            </div>
                        </div>

                        {/* 사용자 검색창 */}
                        <div className="mt-5 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={userSearchQuery}
                                onChange={(e) =>
                                    setUserSearchQuery(e.target.value)
                                }
                                placeholder="사용자 이름, 사원번호, 이메일 검색..."
                                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/15 transition"
                            />
                            {userSearchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setUserSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 사용자 리스트 */}
                    <div className="p-6 space-y-3">
                        {isLoadingUsers ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                <p className="text-xs font-medium">
                                    본인 회사 사용자 목록을 불러오는 중입니다...
                                </p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <Users className="w-9 h-9 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    {userSearchQuery
                                        ? `'${userSearchQuery}' 검색 조건에 일치하는 사용자가 없습니다.`
                                        : "등록된 사원이 없습니다."}
                                </p>
                            </div>
                        ) : (
                            filteredUsers.map((member) => {
                                const isExpanded = expandedEmployeeIds.has(
                                    member.employeeId,
                                );
                                const memberFiles =
                                    userFilesMap[member.employeeId] ?? [];
                                const isLoadingFiles = loadingUserFilesIds.has(
                                    member.employeeId,
                                );
                                const memberRoleLabel = formatRoleLabel(
                                    member.role,
                                );
                                const isSelf =
                                    member.companyId === userInfo.companyId &&
                                    member.employeeId === userInfo.employeeId;

                                return (
                                    <div
                                        key={`${member.companyId}_${member.employeeId}`}
                                        onClick={() =>
                                            handleToggleUserFiles(
                                                member.employeeId,
                                            )
                                        }
                                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 overflow-hidden transition"
                                    >
                                        {/* 유저 기본 정보 행 */}
                                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}

                                                <div className="w-11 h-11 rounded-full bg-linear-to-tr from-indigo-600 to-violet-500 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                                                    {member.username.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                                            {member.username}
                                                        </p>
                                                        <span
                                                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                                String(
                                                                    member.role,
                                                                ).includes(
                                                                    "MANAGER",
                                                                ) ||
                                                                String(
                                                                    member.role,
                                                                ).includes(
                                                                    "MASTER",
                                                                )
                                                                    ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                            }`}
                                                        >
                                                            {memberRoleLabel}
                                                        </span>
                                                        {isSelf && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                                본인
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                                        <span>
                                                            사번:{" "}
                                                            <strong className="text-slate-700 dark:text-slate-200">
                                                                {
                                                                    member.employeeId
                                                                }
                                                            </strong>
                                                        </span>
                                                        <span>·</span>
                                                        <span className="truncate">
                                                            {member.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 우측 액션 버튼들: 1) AI 대화 파일 목록 토글 버튼 2) 유저 삭제 버튼 */}
                                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                {/* <button
                                                    type="button"
                                                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                                        isExpanded
                                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                            : "bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700"
                                                    }`}
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span>
                                                        AI 대화 파일 목록 (
                                                        {memberFiles.length})
                                                    </span>
                                                </button> */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setConfirmModal({
                                                            type: "delete-user",
                                                            targetUser: member,
                                                        })
                                                    }
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/60 dark:border-rose-900/50 transition cursor-pointer"
                                                    title="해당 유저 삭제"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>삭제</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 토글 오픈 시: 해당 유저가 메인페이지에 업로드한 AI 대화용 개별 파일 목록 */}
                                        {isExpanded && (
                                            <div className="p-4 sm:p-5 border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                                            {member.username}
                                                            님의 문서 목록
                                                        </h3>
                                                        <span className="text-[11px] font-semibold text-slate-500">
                                                            (
                                                            {memberFiles.length}
                                                            개)
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleTriggerUserFileUpload(
                                                                member.employeeId,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>
                                                            개별 파일 추가
                                                        </span>
                                                    </button>
                                                </div>

                                                {isLoadingFiles ? (
                                                    <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
                                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                                        <span>
                                                            파일 목록을 조회하고
                                                            있습니다...
                                                        </span>
                                                    </div>
                                                ) : memberFiles.length === 0 ? (
                                                    <div className="py-6 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-400">
                                                        해당 사용자가
                                                        메인페이지에 업로드한 AI
                                                        대화용 개별 파일이
                                                        없습니다.
                                                    </div>
                                                ) : (
                                                    <div className="max-h-60 sm:max-h-72 overflow-y-auto pr-1.5 custom-scrollbar">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                            {memberFiles.map(
                                                                (file) => (
                                                                    <div
                                                                        key={
                                                                            file.id
                                                                        }
                                                                        className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                                                                    >
                                                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                                                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0">
                                                                                <FileText className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                                    {
                                                                                        file.name
                                                                                    }
                                                                                </p>
                                                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                                                    {file.size ||
                                                                                        "개별 문서"}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setConfirmModal(
                                                                                    {
                                                                                        type: "delete-user-file",
                                                                                        employeeId:
                                                                                            member.employeeId,
                                                                                        employeeName:
                                                                                            member.username,
                                                                                        file,
                                                                                    },
                                                                                )
                                                                            }
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 transition shrink-0 cursor-pointer"
                                                                            title="해당 파일만 삭제"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                            <span>
                                                                                삭제
                                                                            </span>
                                                                        </button>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </main>

            {/* ===================================================================
                [모달 1] 계정 생성 모달 (회사일련번호 고정 + 하위관리자(ROLE_USER) 권한 고정)
            =================================================================== */}
            {isCreateUserOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
                    onClick={() =>
                        !isSubmittingUser && setIsCreateUserOpen(false)
                    }
                >
                    <div
                        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        사내 사용자 계정 추가
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        본인 회사 소속 하위관리자(사용자) 계정을
                                        생성합니다.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateUserOpen(false)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateAccountSubmit}
                            className="p-6 space-y-3.5"
                        >
                            {createFormError && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-300">
                                    {createFormError}
                                </div>
                            )}

                            {/* 고정 항목 1: 회사일련번호 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                                    회사일련번호 (
                                    {isMaster
                                        ? "선택된 회사 적용"
                                        : "본인 회사 고정"}
                                    )
                                </label>
                                <div className="relative flex items-center">
                                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={`${activeCompanyId} (${activeCompanyName})`}
                                        disabled
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 text-sm font-semibold cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* 고정 항목 2: 계정 권한 */}
                            {/* <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                                    계정 권한
                                </label>
                                <div className="relative flex items-center">
                                    <Shield className="w-4 h-4 text-indigo-500 absolute left-3.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value="사용자 / 하위관리자 (ROLE_USER)"
                                        disabled
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 text-sm font-semibold cursor-not-allowed"
                                    />
                                </div>
                            </div> */}

                            {/* 입력 항목 1: 사원번호 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                                    사원번호
                                </label>
                                <div className="relative flex items-center">
                                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="예: 20260104"
                                        value={newAccountForm.employeeId}
                                        onChange={(e) =>
                                            setNewAccountForm((prev) => ({
                                                ...prev,
                                                employeeId: e.target.value,
                                            }))
                                        }
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                                    />
                                </div>
                            </div>

                            {/* 입력 항목 2: 이름 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                                    이름
                                </label>
                                <div className="relative flex items-center">
                                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="사원 성명 입력"
                                        value={newAccountForm.username}
                                        onChange={(e) =>
                                            setNewAccountForm((prev) => ({
                                                ...prev,
                                                username: e.target.value,
                                            }))
                                        }
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                                    />
                                </div>
                            </div>

                            {/* 입력 항목 3: 사내 이메일 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                                    사내 이메일
                                </label>
                                <div className="relative flex items-center">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                                    <input
                                        type="email"
                                        placeholder="employee@mes-factory.com"
                                        value={newAccountForm.email}
                                        onChange={(e) =>
                                            setNewAccountForm((prev) => ({
                                                ...prev,
                                                email: e.target.value,
                                            }))
                                        }
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                                    />
                                </div>
                            </div>

                            {/* 입력 항목 4: 비밀번호 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                                    비밀번호 (8~20자, 영문·숫자·특수문자 포함)
                                </label>
                                <div className="relative flex items-center">
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                                    <input
                                        type="password"
                                        placeholder="예: Password1!"
                                        value={newAccountForm.password}
                                        onChange={(e) =>
                                            setNewAccountForm((prev) => ({
                                                ...prev,
                                                password: e.target.value,
                                            }))
                                        }
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                                    />
                                </div>
                            </div>

                            {/* 입력 항목 5: 비밀번호 확인 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                                    비밀번호 재입력
                                </label>
                                <div className="relative flex items-center">
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                                    <input
                                        type="password"
                                        placeholder="비밀번호 다시 입력"
                                        value={newAccountForm.confirmPassword}
                                        onChange={(e) =>
                                            setNewAccountForm((prev) => ({
                                                ...prev,
                                                confirmPassword: e.target.value,
                                            }))
                                        }
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-3">
                                <button
                                    type="button"
                                    disabled={isSubmittingUser}
                                    onClick={() => setIsCreateUserOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingUser}
                                    className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition cursor-pointer"
                                >
                                    {isSubmittingUser
                                        ? "생성 중..."
                                        : "계정 추가"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===================================================================
                [모달 2] 삭제 확인 경고창 (예 / 아니오 선택지)
            =================================================================== */}
            {confirmModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
                    onClick={() => !isProcessingDelete && setConfirmModal(null)}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                            {confirmModal.type === "delete-user"
                                ? "해당 사용자를 삭제하시겠습니까?"
                                : "해당 파일을 삭제하시겠습니까?"}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            {confirmModal.type === "delete-user" && (
                                <>
                                    <strong className="text-slate-800 dark:text-slate-200">
                                        {confirmModal.targetUser.username}{" "}
                                        (사번:{" "}
                                        {confirmModal.targetUser.employeeId})
                                    </strong>{" "}
                                    계정을 삭제합니다.
                                </>
                            )}
                            {confirmModal.type === "delete-user-file" && (
                                <>
                                    {confirmModal.employeeName} 님의{" "}
                                    <strong className="text-slate-800 dark:text-slate-200">
                                        {confirmModal.file.name}
                                    </strong>{" "}
                                    파일만 삭제합니다.
                                </>
                            )}
                            {confirmModal.type === "delete-shared-file" && (
                                <>
                                    전사 공용 데이터 파일{" "}
                                    <strong className="text-slate-800 dark:text-slate-200">
                                        {confirmModal.file.name}
                                    </strong>
                                    을(를) 삭제합니다.
                                </>
                            )}
                        </p>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                type="button"
                                disabled={isProcessingDelete}
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                            >
                                아니오
                            </button>
                            <button
                                type="button"
                                disabled={isProcessingDelete}
                                onClick={() => void handleConfirmDelete()}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-bold text-white shadow-md shadow-rose-500/20 transition cursor-pointer"
                            >
                                {isProcessingDelete ? "삭제 중..." : "예"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================================================
                [모달 3] 공용 데이터 / 개별 파일 중복 업로드 차단 안내 경고창
            =================================================================== */}
            {duplicateFileModal && duplicateFileModal.names.length > 0 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
                    onClick={() => setDuplicateFileModal(null)}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                            {duplicateFileModal.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            {duplicateFileModal.description}
                        </p>

                        <div className="mt-3 max-h-28 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 px-3 py-2 text-left space-y-1">
                            {duplicateFileModal.names.map((name) => (
                                <p
                                    key={name}
                                    className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate"
                                    title={name}
                                >
                                    • {name}
                                </p>
                            ))}
                        </div>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setDuplicateFileModal(null)}
                                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition cursor-pointer"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
