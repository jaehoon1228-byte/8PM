"use client";

// =====================================================================
// 메인(대시보드) 화면 컨테이너
//  - 백엔드(MES-AI-ChatBot-Web-BackEnd) API 규격에 맞춰 동작
//    1) 새 대화에서 첫 질문 시: POST /api/v1/chat/sessionrooms → POST /api/v1/chat/sessions/{sessionId}/ask
//    2) 대화방 선택 시: GET /api/v1/chat/sessions/{sessionId}/histories
//    3) 대화방 삭제 시: DELETE /api/v1/chat/sessions/{sessionId}
//    4) 파일 업로드: POST /api/v1/files/upload (multipart/form-data, key="file")
//    5) 파일 삭제: DELETE /api/v1/files/delete/{fileId}
//  - 푸시 알림 ON 시: 다른 탭/작업 이동 또는 설정 창 열람 중에 AI 답변 도착 시 데스크톱 알림 & 인앱 토스트 표시
// =====================================================================

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, X } from "lucide-react";
import { isHTTPError } from "ky";
import ChatSidebar from "@/components/dashboard/ChatSidebar";
import ChatPanel from "@/components/dashboard/ChatPanel";
import ProfileCard from "@/components/dashboard/ProfileCard";
import FileListPanel from "@/components/dashboard/FileListPanel";
import SettingsModal from "@/components/dashboard/SettingsModal";
import {
    askToLlm,
    createChatSession,
    deleteChatSession,
    deleteFile,
    extractErrorMessage,
    fetchChatHistories,
    fetchChatSessions,
    fetchMyInfo,
    isSessionExpired,
    uploadFiles,
} from "@/utils/dashboardApi";
import { formatTime } from "@/utils/endpoints";
import {
    applyThemeClass,
    getPreferences,
    notifyChatResponseReady,
} from "@/utils/preferences";
import type {
    ChatSession,
    DashboardInitialData,
    Message,
    UploadedFile,
    UserInfo,
} from "@/types/dashboard";

interface DashboardFormProps {
    initialData?: DashboardInitialData;
}

interface ReplyBanner {
    sessionId: string;
    title: string;
    preview: string;
}

const EMPTY_INITIAL_DATA: DashboardInitialData = {
    userInfo: null,
    chatSessions: null,
    files: null,
};

const STORAGE_KEYS = {
    sessions: (empId: number) => `mes_chat_sessions_${empId}`,
    files: (empId: number) => `mes_uploaded_files_${empId}`,
};

export default function DashboardForm({ initialData = EMPTY_INITIAL_DATA }: DashboardFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ---------------- 서버 데이터 (SSR 초기값) ----------------
    const [userInfo, setUserInfo] = useState<UserInfo | undefined>(
        initialData.userInfo ?? undefined,
    );
    const [chatSessions, setChatSessions] = useState<ChatSession[]>(
        initialData.chatSessions ?? [],
    );
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialData.files ?? []);

    // ---------------- 클라이언트 UI 상태 (CSR) ----------------
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [sendingChatId, setSendingChatId] = useState<string | null>(null);
    const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [replyBanner, setReplyBanner] = useState<ReplyBanner | null>(null);

    const activeChatIdRef = useRef<string | null>(null);
    const isSettingsOpenRef = useRef(false);
    const loadingChatIdsRef = useRef<Set<string>>(new Set());
    const isRedirectingRef = useRef(false);
    const storageHydratedRef = useRef(false);

    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    useEffect(() => {
        isSettingsOpenRef.current = isSettingsOpen;
    }, [isSettingsOpen]);

    useEffect(() => {
        applyThemeClass(getPreferences().darkMode);
    }, []);

    const currentChat = chatSessions.find((chat) => chat.id === activeChatId);

    /** 사원번호가 확인된 시점에 로컬 스토리지에 보존된 대화방/파일 메타데이터를 복원 */
    const hydrateFromStorage = (employeeId: number) => {
        if (storageHydratedRef.current) return;
        try {
            const savedSessions = localStorage.getItem(STORAGE_KEYS.sessions(employeeId));
            if (savedSessions) {
                const parsed = JSON.parse(savedSessions) as ChatSession[];
                setChatSessions((prev) => {
                    const existingIds = new Set(prev.map((s) => s.id));
                    const restored = parsed
                        .filter((s) => !s.id.startsWith("temp-") && !existingIds.has(s.id))
                        .map((s) => ({ ...s, messages: [], isLoaded: false }));
                    return [...prev, ...restored];
                });
            }

            const savedFiles = localStorage.getItem(STORAGE_KEYS.files(employeeId));
            if (savedFiles) {
                const parsed = JSON.parse(savedFiles) as UploadedFile[];
                setUploadedFiles((prev) => {
                    const existingIds = new Set(prev.map((f) => f.id));
                    return [...prev, ...parsed.filter((f) => !existingIds.has(f.id))];
                });
            }
        } catch (error) {
            console.error("로컬 저장 데이터 복원 실패:", error);
        } finally {
            storageHydratedRef.current = true;
        }
    };

    /** 공통 에러 처리: 세션 만료 시 1회만 안내 후 로그인 화면으로 이동 */
    const handleApiError = async (
        error: unknown,
        fallbackMessage: string,
        notify = false,
    ): Promise<boolean> => {
        if (isSessionExpired(error)) {
            if (!isRedirectingRef.current) {
                isRedirectingRef.current = true;
                alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                router.push("/");
            }
            return true;
        }

        const detailMessage = await extractErrorMessage(error, fallbackMessage);
        if (isHTTPError(error)) {
            console.error(fallbackMessage, error.response.status, detailMessage);
        } else {
            console.error(fallbackMessage, error);
        }
        if (notify) alert(detailMessage);
        return false;
    };

    // ---------------- CSR Fallback & 로컬 스토리지 복원 ----------------
    useEffect(() => {
        let ignore = false;

        if (initialData.userInfo?.employeeId) {
            queueMicrotask(() => {
                if (!ignore && initialData.userInfo?.employeeId) {
                    hydrateFromStorage(initialData.userInfo.employeeId);
                }
            });
        }

        const tasks: Promise<void>[] = [];

        if (initialData.userInfo === null) {
            tasks.push(
                fetchMyInfo()
                    .then((data) => {
                        if (!ignore) {
                            setUserInfo(data);
                            hydrateFromStorage(data.employeeId);
                        }
                    })
                    .catch((err) => {
                        if (!ignore) void handleApiError(err, "사용자 정보 조회에 실패했습니다.");
                    }),
            );
        }
        if (initialData.chatSessions === null) {
            tasks.push(
                fetchChatSessions()
                    .then((data) => {
                        if (!ignore && data.length > 0) {
                            setChatSessions((prev) => {
                                const existingIds = new Set(data.map((s) => s.id));
                                return [...prev.filter((c) => !existingIds.has(c.id)), ...data];
                            });
                        }
                    })
                    .catch((err) => {
                        if (!ignore) void handleApiError(err, "채팅 목록 조회에 실패했습니다.");
                    }),
            );
        }

        void Promise.all(tasks);
        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!userInfo?.employeeId || !storageHydratedRef.current) return;
        try {
            const persistableSessions = chatSessions
                .filter((s) => !s.id.startsWith("temp-"))
                .map(({ id, title }) => ({ id, title, messages: [], isLoaded: false }));
            localStorage.setItem(
                STORAGE_KEYS.sessions(userInfo.employeeId),
                JSON.stringify(persistableSessions),
            );
        } catch {
            // 스토리지 용량 초과 등은 무시
        }
    }, [chatSessions, userInfo?.employeeId]);

    useEffect(() => {
        if (!userInfo?.employeeId || !storageHydratedRef.current) return;
        try {
            localStorage.setItem(
                STORAGE_KEYS.files(userInfo.employeeId),
                JSON.stringify(uploadedFiles),
            );
        } catch {
            // 스토리지 용량 초과 등은 무시
        }
    }, [uploadedFiles, userInfo?.employeeId]);

    // ---------------- 채팅 ----------------
    const handleNewChat = () => {
        setActiveChatId(null);
        setResetKey((prev) => prev + 1);
    };

    const handleSelectChat = async (id: string) => {
        setActiveChatId(id);

        const target = chatSessions.find((chat) => chat.id === id);
        if (
            !target ||
            target.isLoaded ||
            id.startsWith("temp-") ||
            loadingChatIdsRef.current.has(id)
        ) {
            return;
        }

        loadingChatIdsRef.current.add(id);
        setLoadingChatId(id);
        try {
            const messages = await fetchChatHistories(id);
            setChatSessions((prev) =>
                prev.map((chat) =>
                    chat.id === id
                        ? { ...chat, messages: [...messages, ...chat.messages], isLoaded: true }
                        : chat,
                ),
            );
        } catch (error) {
            await handleApiError(error, "대화 내역을 불러오지 못했습니다.", true);
        } finally {
            loadingChatIdsRef.current.delete(id);
            setLoadingChatId((prev) => (prev === id ? null : prev));
        }
    };

    /** 1. 채팅방 삭제 기능 */
    const handleDeleteChat = async (id: string) => {
        const index = chatSessions.findIndex((c) => c.id === id);
        if (index === -1) return;
        const target = chatSessions[index];

        if (!confirm(`'${target.title}' 채팅방을 삭제하시겠습니까?`)) return;

        // 낙관적 업데이트: 화면에서 먼저 제거
        setChatSessions((prev) => prev.filter((c) => c.id !== id));
        if (activeChatId === id) {
            setActiveChatId(null);
        }

        try {
            await deleteChatSession(id);
        } catch (error) {
            setChatSessions((prev) => {
                if (prev.some((c) => c.id === id)) return prev;
                const next = [...prev];
                next.splice(Math.min(index, next.length), 0, target);
                return next;
            });
            await handleApiError(error, "채팅방 삭제에 실패했습니다.", true);
        }
    };

    const handleSend = async (text: string) => {
        if (sendingChatId !== null) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            text,
            sender: "user",
            timestamp: formatTime(new Date()),
        };

        const isNewSession = activeChatId === null;
        const localChatId = activeChatId ?? `temp-${Date.now()}`;

        if (isNewSession) {
            const optimisticSession: ChatSession = {
                id: localChatId,
                title: text,
                messages: [userMsg],
                isLoaded: true,
            };
            setChatSessions((prev) => [optimisticSession, ...prev]);
            setActiveChatId(localChatId);
        } else {
            setChatSessions((prev) =>
                prev.map((chat) =>
                    chat.id === localChatId
                        ? { ...chat, messages: [...chat.messages, userMsg] }
                        : chat,
                ),
            );
        }

        setSendingChatId(localChatId);
        let targetSessionId = localChatId;
        let sessionTitle = text;

        try {
            if (isNewSession) {
                const created = await createChatSession(text);
                targetSessionId = created.id;
                sessionTitle = created.title || text;

                setChatSessions((prev) =>
                    prev.map((chat) =>
                        chat.id === localChatId
                            ? { ...chat, id: created.id, title: sessionTitle }
                            : chat,
                    ),
                );
                setActiveChatId((prev) => (prev === localChatId ? created.id : prev));
                setSendingChatId(created.id);
            } else {
                const found = chatSessions.find((c) => c.id === localChatId);
                if (found) sessionTitle = found.title;
            }

            const answerMsg = await askToLlm(targetSessionId, text);

            setChatSessions((prev) =>
                prev.map((chat) =>
                    chat.id === targetSessionId
                        ? { ...chat, messages: [...chat.messages, answerMsg] }
                        : chat,
                ),
            );

            // 2-3. 푸시 알림이 켜져 있고, 사용자가 다른 탭/창을 보고 있거나 다른 대화방/설정창에 있을 때 알림 발송
            const prefs = getPreferences();
            const isAwayFromThisChat =
                document.visibilityState === "hidden" ||
                !document.hasFocus() ||
                activeChatIdRef.current !== targetSessionId ||
                isSettingsOpenRef.current;

            if (prefs.notifications && isAwayFromThisChat) {
                notifyChatResponseReady(sessionTitle, answerMsg.text);
                setReplyBanner({
                    sessionId: targetSessionId,
                    title: sessionTitle,
                    preview: answerMsg.text.replace(/\s+/g, " ").slice(0, 75),
                });
            }
        } catch (error) {
            const expired = await handleApiError(error, "메시지 전송에 실패했습니다.");
            if (!expired) {
                const errorMsg: Message = {
                    id: `err-${Date.now()}`,
                    text: "답변을 받지 못했습니다. 잠시 후 다시 시도해주세요.",
                    sender: "bot",
                    timestamp: formatTime(new Date()),
                };
                setChatSessions((prev) =>
                    prev.map((chat) =>
                        chat.id === targetSessionId
                            ? { ...chat, messages: [...chat.messages, errorMsg] }
                            : chat,
                    ),
                );
            }
        } finally {
            setSendingChatId(null);
        }
    };

    // ---------------- 파일 ----------------
    const handleOpenFilePicker = () => {
        if (isUploading) return;
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const selected = Array.from(files);
        e.target.value = "";

        setIsUploading(true);
        try {
            const { uploaded, failed } = await uploadFiles(selected);
            if (uploaded.length > 0) {
                setUploadedFiles((prev) => [...uploaded, ...prev]);
            }
            if (failed.length > 0) {
                const summary = failed.map((f) => `- ${f.name}: ${f.reason}`).join("\n");
                alert(`일부 파일 업로드에 실패했습니다.\n${summary}`);
            }
        } catch (error) {
            await handleApiError(error, "파일 업로드에 실패했습니다.", true);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = async (id: string) => {
        const index = uploadedFiles.findIndex((file) => file.id === id);
        if (index === -1) return;
        const removed = uploadedFiles[index];

        if (!confirm(`'${removed.name}' 파일을 삭제하시겠습니까?`)) return;

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
    };

    const handleClearLocalCache = () => {
        setChatSessions([]);
        setUploadedFiles([]);
        setActiveChatId(null);
    };

    return (
        <div className="flex h-screen w-full bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16] p-5 gap-5 relative overflow-hidden font-sans box-border transition-colors">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.xlsx,.pptx,.csv"
                className="hidden"
                multiple
            />

            {/* 2-3. 푸시 알림 토스트 배너 (다른 작업 중 답변 완료 시 표시) */}
            {replyBanner && (
                <div className="fixed top-6 right-6 z-50 max-w-sm bg-slate-900 dark:bg-indigo-950 text-white rounded-2xl p-4 shadow-2xl border border-indigo-500/30 flex items-start gap-3 animate-bounce">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                        <BellRing className="w-4 h-4" />
                    </div>
                    <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                            setIsSettingsOpen(false);
                            setActiveChatId(replyBanner.sessionId);
                            setReplyBanner(null);
                        }}
                    >
                        <p className="text-xs font-bold text-indigo-300">
                            AI 답변 도착 · {replyBanner.title}
                        </p>
                        <p className="text-xs text-slate-200 truncate mt-0.5">
                            {replyBanner.preview}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setReplyBanner(null)}
                        className="text-slate-400 hover:text-white p-1 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

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
                isWaitingReply={sendingChatId !== null && sendingChatId === activeChatId}
                isLoadingMessages={loadingChatId !== null && loadingChatId === activeChatId}
                resetKey={resetKey}
                onSend={handleSend}
                onOpenFilePicker={handleOpenFilePicker}
            />

            <div className="w-72 flex flex-col gap-5 shrink-0">
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

            {/* 2. 우측 상단 원형 버튼 클릭 시 열리는 통합 설정 모달 */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                userInfo={userInfo}
                onClearLocalCache={handleClearLocalCache}
            />
        </div>
    );
}
