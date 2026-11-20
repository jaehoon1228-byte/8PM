"use client";

// =====================================================================
// 메인(대시보드) 공통 3단 셸 컨테이너
//  - 좌측 사이드바(채팅 목록 메타데이터) + 중앙 채팅 슬롯({children}) + 우측 프로필/파일 패널
//  - 각 채팅방의 대화 내역은 경로(`/chat/[chatId]`)의 page.tsx가 단독 조회해 {children}에 렌더링
// =====================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/dashboard/ChatSidebar";
import ProfileCard from "@/components/dashboard/ProfileCard";
import FileListPanel from "@/components/dashboard/FileListPanel";
import SettingsModal from "@/components/dashboard/SettingsModal";
import ReplyToastBanner from "@/components/dashboard/ReplyToastBanner";
import DuplicateFileModal from "@/components/dashboard/DuplicateFileModal";
import {
    DashboardShellProvider,
    type DashboardShellContextValue,
} from "@/components/dashboard/DashboardShellContext";
import { useDashboardError } from "@/hooks/useDashboardError";
import { useDashboardChat } from "@/hooks/useDashboardChat";
import { useDashboardFiles } from "@/hooks/useDashboardFiles";
import { fetchMyInfo } from "@/utils/dashboardApi";
import { reviveUploadedFile, toUserInfo } from "@/utils/endpoints";
import { applyThemeClass, getPreferences } from "@/utils/preferences";
import type { DashboardInitialData, UserInfo } from "@/types/dashboard";

interface DashboardFormProps {
    initialData?: DashboardInitialData;
    children: React.ReactNode;
}

const EMPTY_INITIAL_DATA: DashboardInitialData = {
    userInfo: null,
    chatSessions: null,
    files: null,
};

export default function DashboardForm({
    initialData = EMPTY_INITIAL_DATA,
    children,
}: DashboardFormProps) {
    const router = useRouter();
    const { handleApiError } = useDashboardError();

    // ---------------- 서버 데이터 (SSR 초기값) ----------------
    const [userInfo, setUserInfo] = useState<UserInfo | undefined>(
        initialData.userInfo ? toUserInfo(initialData.userInfo) : undefined,
    );

    // ---------------- UI 모달 상태 ----------------
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const isSettingsOpenRef = useRef(false);

    useEffect(() => {
        isSettingsOpenRef.current = isSettingsOpen;
    }, [isSettingsOpen]);

    useEffect(() => {
        applyThemeClass(getPreferences().darkMode);
    }, []);

    // SSR에서 userInfo가 전달되지 않은 예외 케이스(단독 렌더링 등) 대비 폴백
    useEffect(() => {
        if (initialData.userInfo !== null) return;
        let ignore = false;

        fetchMyInfo()
            .then((data) => {
                if (!ignore) setUserInfo(data);
            })
            .catch((err) => {
                if (!ignore) {
                    void handleApiError(
                        err,
                        "사용자 정보 조회에 실패했습니다.",
                    );
                }
            });

        return () => {
            ignore = true;
        };
    }, [initialData.userInfo, handleApiError]);

    // ---------------- 도메인 로직 훅 ----------------
    const {
        chatSessions,
        newChatResetKey,
        replyBanner,
        setReplyBanner,
        addSessionToSidebar,
        getSessionTitle,
        handleNewChat,
        handleSelectChat,
        handleDeleteChat,
        clearChatState,
    } = useDashboardChat({
        initialSessions: initialData.chatSessions ?? [],
        shouldFetchSessions: initialData.chatSessions === null,
        employeeId: userInfo?.employeeId,
        handleApiError,
    });

    const {
        uploadedFiles,
        isUploading,
        duplicateFileModal,
        setDuplicateFileModal,
        fileInputRef,
        handleOpenFilePicker,
        handleFileUpload,
        handleRemoveFile,
        clearFileState,
    } = useDashboardFiles({
        initialFiles: initialData.files?.map(reviveUploadedFile) ?? [],
        employeeId: userInfo?.employeeId,
        companyId: userInfo?.companyId,
        handleApiError,
    });

    const shellContextValue = useMemo<DashboardShellContextValue>(
        () => ({
            companyName: userInfo?.companyName,
            newChatResetKey,
            openFilePicker: handleOpenFilePicker,
            addSessionToSidebar,
            getSessionTitle,
            isSettingsOpenRef,
            handleApiError,
        }),
        [
            userInfo?.companyName,
            newChatResetKey,
            handleOpenFilePicker,
            addSessionToSidebar,
            getSessionTitle,
            handleApiError,
        ],
    );

    const handleClearLocalCache = () => {
        clearChatState();
        clearFileState();
    };

    return (
        <DashboardShellProvider value={shellContextValue}>
            <div className="flex h-screen w-full bg-linear-to-br from-slate-100 via-indigo-50/40 to-slate-200 dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16] p-5 gap-5 relative overflow-hidden box-border transition-colors">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.xlsx,.pptx,.csv"
                    className="hidden"
                    multiple
                />

                <ReplyToastBanner
                    banner={replyBanner}
                    onSelectSession={(sessionId) => {
                        setIsSettingsOpen(false);
                        setReplyBanner(null);
                        router.push(`/chat/${encodeURIComponent(sessionId)}`);
                    }}
                    onDismiss={() => setReplyBanner(null)}
                />

                <ChatSidebar
                    chatSessions={chatSessions}
                    onNewChat={handleNewChat}
                    onSelectChat={handleSelectChat}
                    onDeleteChat={handleDeleteChat}
                />

                {children}

                <div className="w-72 min-h-0 flex flex-col gap-5 shrink-0">
                    <ProfileCard
                        userInfo={userInfo}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                    />

                    <FileListPanel
                        uploadedFiles={uploadedFiles}
                        isUploading={isUploading}
                        onRemoveFile={handleRemoveFile}
                    />
                </div>

                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    userInfo={userInfo}
                    onClearLocalCache={handleClearLocalCache}
                />

                <DuplicateFileModal
                    duplicateNames={duplicateFileModal}
                    onClose={() => setDuplicateFileModal(null)}
                />
            </div>
        </DashboardShellProvider>
    );
}
