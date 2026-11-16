"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReplyBanner } from "@/components/dashboard/ReplyToastBanner";
import type { ChatSession, Message } from "@/types/dashboard";
import {
    askToLlm,
    createChatSession,
    deleteChatSession,
    fetchChatHistories,
    fetchChatSessions,
} from "@/utils/dashboardApi";
import { formatTime } from "@/utils/endpoints";
import { getPreferences, notifyChatResponseReady } from "@/utils/preferences";
import {
    getStoredChatSessions,
    setStoredChatSessions,
} from "@/utils/store/chatSessionStore";
import { nowMs } from "@/utils/time";

interface UseDashboardChatOptions {
    initialSessions: ChatSession[];
    shouldFetchSessions: boolean;
    employeeId?: number;
    isSettingsOpenRef: React.RefObject<boolean>;
    handleApiError: (
        error: unknown,
        fallbackMessage: string,
        notify?: boolean,
    ) => Promise<boolean>;
}

/**
 * 대시보드 채팅방 목록, 대화 내역 조회, 메시지 전송(낙관적 업데이트 및 롤백),
 * 로컬 스토리지 동기화, 푸시 알림 배너 상태를 관리하는 훅입니다.
 */
export function useDashboardChat({
    initialSessions,
    shouldFetchSessions,
    employeeId,
    isSettingsOpenRef,
    handleApiError,
}: UseDashboardChatOptions) {
    const [chatSessions, setChatSessions] =
        useState<ChatSession[]>(initialSessions);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [sendingChatId, setSendingChatId] = useState<string | null>(null);
    const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
    const [resetKey, setResetKey] = useState(0);
    const [replyBanner, setReplyBanner] = useState<ReplyBanner | null>(null);

    const chatSessionsRef = useRef<ChatSession[]>(initialSessions);
    const activeChatIdRef = useRef<string | null>(null);
    const loadingChatIdsRef = useRef<Set<string>>(new Set());
    const storageHydratedRef = useRef(false);
    const skipNextPersistRef = useRef(false);

    useEffect(() => {
        chatSessionsRef.current = chatSessions;
    }, [chatSessions]);

    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    // 마운트 시 로컬 스토리지 복원 및 SSR 미조회 시 채팅 목록 조회
    useEffect(() => {
        let ignore = false;

        async function initializeChats() {
            await Promise.resolve();
            if (ignore) return;

            if (employeeId !== undefined && !storageHydratedRef.current) {
                try {
                    const savedSessions = getStoredChatSessions(employeeId);
                    if (savedSessions.length > 0) {
                        setChatSessions((prev) => {
                            const existingIds = new Set(prev.map((s) => s.id));
                            const restored = savedSessions
                                .filter(
                                    (s) =>
                                        !s.id.startsWith("temp-") &&
                                        !existingIds.has(s.id),
                                )
                                .map((s) => ({
                                    ...s,
                                    messages: [],
                                    isLoaded: false,
                                }));
                            return [...prev, ...restored];
                        });
                    }
                } catch (error) {
                    console.error("로컬 채팅 목록 복원 실패:", error);
                } finally {
                    storageHydratedRef.current = true;
                }
            }

            if (shouldFetchSessions) {
                try {
                    const data = await fetchChatSessions();
                    if (!ignore && data.length > 0) {
                        setChatSessions((prev) => {
                            const existingIds = new Set(data.map((s) => s.id));
                            return [
                                ...prev.filter((c) => !existingIds.has(c.id)),
                                ...data,
                            ];
                        });
                    }
                } catch (error) {
                    if (!ignore) {
                        await handleApiError(
                            error,
                            "채팅 목록 조회에 실패했습니다.",
                        );
                    }
                }
            }
        }

        void initializeChats();
        return () => {
            ignore = true;
        };
    }, [employeeId, shouldFetchSessions, handleApiError]);

    // 채팅 목록 변경 시 로컬 스토리지 동기화
    useEffect(() => {
        if (!employeeId || !storageHydratedRef.current) return;
        if (skipNextPersistRef.current) {
            skipNextPersistRef.current = false;
            return;
        }
        try {
            const persistableSessions = chatSessions
                .filter((s) => !s.id.startsWith("temp-"))
                .map(({ id, title }) => ({
                    id,
                    title,
                    messages: [],
                    isLoaded: false,
                }));
            setStoredChatSessions(employeeId, persistableSessions);
        } catch {
            // 스토리지 용량 초과 등은 무시
        }
    }, [chatSessions, employeeId]);

    const handleNewChat = useCallback(() => {
        setActiveChatId(null);
        setResetKey((prev) => prev + 1);
    }, []);

    const handleSelectChat = useCallback(
        async (id: string) => {
            setActiveChatId(id);

            const target = chatSessionsRef.current.find(
                (chat) => chat.id === id,
            );
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
                    prev.map((chat) => {
                        if (chat.id !== id) return chat;
                        const loadedIds = new Set(messages.map((m) => m.id));
                        const remaining = chat.messages.filter(
                            (m) => !loadedIds.has(m.id),
                        );
                        return {
                            ...chat,
                            messages: [...messages, ...remaining],
                            isLoaded: true,
                        };
                    }),
                );
            } catch (error) {
                await handleApiError(
                    error,
                    "대화 내역을 불러오지 못했습니다.",
                    activeChatIdRef.current === id,
                );
            } finally {
                loadingChatIdsRef.current.delete(id);
                setLoadingChatId((prev) => (prev === id ? null : prev));
            }
        },
        [handleApiError],
    );

    const handleDeleteChat = useCallback(
        async (id: string) => {
            const index = chatSessionsRef.current.findIndex((c) => c.id === id);
            if (index === -1) return;
            const target = chatSessionsRef.current[index];

            if (!confirm(`'${target.title}' 채팅방을 삭제하시겠습니까?`))
                return;

            setChatSessions((prev) => prev.filter((c) => c.id !== id));
            setActiveChatId((prev) => (prev === id ? null : prev));

            try {
                await deleteChatSession(id);
            } catch (error) {
                setChatSessions((prev) => {
                    if (prev.some((c) => c.id === id)) return prev;
                    const next = [...prev];
                    next.splice(Math.min(index, next.length), 0, target);
                    return next;
                });
                await handleApiError(
                    error,
                    "채팅방 삭제에 실패했습니다.",
                    true,
                );
            }
        },
        [handleApiError],
    );

    const handleSend = useCallback(
        async (text: string) => {
            if (sendingChatId !== null) return;

            const userMsg: Message = {
                id: `user-${nowMs()}`,
                text,
                sender: "user",
                timestamp: formatTime(),
            };

            const currentActiveId = activeChatIdRef.current;
            const isNewSession = currentActiveId === null;
            const localChatId = currentActiveId ?? `temp-${nowMs()}`;

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
            let sessionCreated = !isNewSession;

            try {
                if (isNewSession) {
                    const created = await createChatSession(text);
                    targetSessionId = created.id;
                    sessionTitle = created.title || text;
                    sessionCreated = true;

                    setChatSessions((prev) =>
                        prev.map((chat) =>
                            chat.id === localChatId
                                ? {
                                      ...chat,
                                      id: created.id,
                                      title: sessionTitle,
                                  }
                                : chat,
                        ),
                    );
                    setActiveChatId((prev) =>
                        prev === localChatId ? created.id : prev,
                    );
                    setSendingChatId(created.id);
                } else {
                    const found = chatSessionsRef.current.find(
                        (c) => c.id === localChatId,
                    );
                    if (found) sessionTitle = found.title;
                }

                const answerMsg = await askToLlm(targetSessionId, text);

                setChatSessions((prev) =>
                    prev.map((chat) =>
                        chat.id === targetSessionId
                            ? {
                                  ...chat,
                                  messages: [...chat.messages, answerMsg],
                              }
                            : chat,
                    ),
                );

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
                        preview: answerMsg.text
                            .replace(/\s+/g, " ")
                            .slice(0, 75),
                    });
                }
            } catch (error) {
                const expired = await handleApiError(
                    error,
                    "메시지 전송에 실패했습니다.",
                    !sessionCreated,
                );
                if (!sessionCreated) {
                    // 새 채팅방 생성 자체가 실패한 경우 임시 세션 롤백
                    setChatSessions((prev) =>
                        prev.filter((chat) => chat.id !== localChatId),
                    );
                    setActiveChatId((prev) =>
                        prev === localChatId ? null : prev,
                    );
                } else if (!expired) {
                    const errorMsg: Message = {
                        id: `err-${nowMs()}`,
                        text: "답변을 받지 못했습니다. 잠시 후 다시 시도해주세요.",
                        sender: "bot",
                        timestamp: formatTime(),
                    };
                    setChatSessions((prev) =>
                        prev.map((chat) =>
                            chat.id === targetSessionId
                                ? {
                                      ...chat,
                                      messages: [...chat.messages, errorMsg],
                                  }
                                : chat,
                        ),
                    );
                }
            } finally {
                setSendingChatId(null);
            }
        },
        [sendingChatId, isSettingsOpenRef, handleApiError],
    );

    const clearChatState = useCallback(() => {
        skipNextPersistRef.current = true;
        setChatSessions([]);
        setActiveChatId(null);
        setReplyBanner(null);
    }, []);

    return {
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
    };
}
