"use client";

// =====================================================================
// 메인(대시보드) 화면 컨테이너
//  - SSR 초기 데이터를 받아 채팅/파일/설정의 도메인 훅과 하위 UI 컴포넌트를 조합
//  - 푸시 알림 ON 시: 다른 탭/작업 이동 또는 설정 창 열람 중에 AI 답변 도착 시 데스크톱 알림 & 인앱 토스트 표시
// =====================================================================

import { useEffect, useRef, useState } from "react";
import ChatSidebar from "@/components/dashboard/ChatSidebar";
import ChatPanel from "@/components/dashboard/ChatPanel";
import ProfileCard from "@/components/dashboard/ProfileCard";
import FileListPanel from "@/components/dashboard/FileListPanel";
import SettingsModal from "@/components/dashboard/SettingsModal";
import ReplyToastBanner from "@/components/dashboard/ReplyToastBanner";
import DuplicateFileModal from "@/components/dashboard/DuplicateFileModal";
import { useDashboardError } from "@/hooks/useDashboardError";
import { useDashboardChat } from "@/hooks/useDashboardChat";
import { useDashboardFiles } from "@/hooks/useDashboardFiles";
import { fetchMyInfo } from "@/utils/dashboardApi";
import { reviveUploadedFile, toUserInfo } from "@/utils/endpoints";
import { applyThemeClass, getPreferences } from "@/utils/preferences";
import type { DashboardInitialData, UserInfo } from "@/types/dashboard";

interface DashboardFormProps {
    initialData?: DashboardInitialData;
}

const EMPTY_INITIAL_DATA: DashboardInitialData = {
    userInfo: null,
    chatSessions: null,
    files: null,
};

export default function DashboardForm({
    initialData = EMPTY_INITIAL_DATA,
}: DashboardFormProps) {
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
        activeChatId,
        setActiveChatId,
        sendingChatId,
        loadingChatId,
        resetKey,
        replyBanner,
        setReplyBanner,
        handleNewChat,
        handleSelectChat,
        handleDeleteChat,
        handleSend,
        clearChatState,
    } = useDashboardChat({
        initialSessions: initialData.chatSessions ?? [],
        shouldFetchSessions: initialData.chatSessions === null,
        employeeId: userInfo?.employeeId,
        isSettingsOpenRef,
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

    const currentChat = chatSessions.find((chat) => chat.id === activeChatId);

    const handleClearLocalCache = () => {
        clearChatState();
        clearFileState();
    };

    return (
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
                    setActiveChatId(sessionId);
                    setReplyBanner(null);
                }}
                onDismiss={() => setReplyBanner(null)}
            />

            <ChatSidebar
                chatSessions={chatSessions}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
            />

            <ChatPanel
                currentChat={currentChat}
                companyName={userInfo?.companyName}
                isSending={sendingChatId !== null}
                isWaitingReply={
                    sendingChatId !== null && sendingChatId === activeChatId
                }
                isLoadingMessages={
                    loadingChatId !== null && loadingChatId === activeChatId
                }
                resetKey={resetKey}
                onSend={handleSend}
                onOpenFilePicker={handleOpenFilePicker}
            />

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
    );
}
