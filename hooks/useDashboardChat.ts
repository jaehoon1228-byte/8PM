"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatSession } from "@/types/dashboard";
import { deleteChatSession, fetchChatSessions } from "@/utils/dashboardApi";
import { useChatRuntimeStore } from "@/utils/store/chatRuntimeStore";
import {
    getStoredChatSessions,
    setStoredChatSessions,
} from "@/utils/store/chatSessionStore";

interface UseDashboardChatOptions {
    initialSessions: ChatSession[];
    shouldFetchSessions: boolean;
    employeeId?: number;
    handleApiError: (
        error: unknown,
        fallbackMessage: string,
        notify?: boolean,
    ) => Promise<boolean>;
}

/**
 * 대시보드 좌측 사이드바의 채팅방 목록 메타데이터(`id`, `title`),
 * 라우트 이동(`/chat`, `/chat/[chatId]`), 채팅방 삭제 및 로컬 스토리지 동기화를 관리하는 훅입니다.
 * 개별 채팅방의 대화 내역은 각 `/chat/[chatId]` 경로에서 단독 조회합니다.
 */
export function useDashboardChat({
    initialSessions,
    shouldFetchSessions,
    employeeId,
    handleApiError,
}: UseDashboardChatOptions) {
    const router = useRouter();

    const [chatSessions, setChatSessions] =
        useState<ChatSession[]>(initialSessions);
    const [newChatResetKey, setNewChatResetKey] = useState(0);

    const pendingSessions = useChatRuntimeStore(
        (state) => state.pendingSessions,
    );
    const replyBanner = useChatRuntimeStore((state) => state.replyBanner);
    const setReplyBanner = useChatRuntimeStore((state) => state.setReplyBanner);

    const mergedSessions = useMemo(() => {
        if (pendingSessions.length === 0) return chatSessions;
        const existingIds = new Set(chatSessions.map((s) => s.id));
        const extra = pendingSessions.filter((s) => !existingIds.has(s.id));
        return extra.length > 0 ? [...extra, ...chatSessions] : chatSessions;
    }, [chatSessions, pendingSessions]);

    const mergedSessionsRef = useRef<ChatSession[]>(mergedSessions);
    const storageHydratedRef = useRef(false);
    const skipNextPersistRef = useRef(false);

    useEffect(() => {
        mergedSessionsRef.current = mergedSessions;
    }, [mergedSessions]);

    // 마운트 시 로컬 스토리지 목록 메타데이터 복원 및 SSR 미조회 시 채팅 목록 조회
    useEffect(() => {
        let ignore = false;

        async function initializeSessions() {
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
                                    id: s.id,
                                    title: s.title,
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

        void initializeSessions();
        return () => {
            ignore = true;
        };
    }, [employeeId, shouldFetchSessions, handleApiError]);

    // 채팅 목록 메타데이터 변경 시 로컬 스토리지 동기화
    useEffect(() => {
        if (!employeeId || !storageHydratedRef.current) return;
        if (skipNextPersistRef.current) {
            skipNextPersistRef.current = false;
            return;
        }
        try {
            const persistableSessions = mergedSessions
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
    }, [mergedSessions, employeeId]);

    const addSessionToSidebar = useCallback((session: ChatSession) => {
        setChatSessions((prev) => {
            if (prev.some((c) => c.id === session.id)) return prev;
            return [
                {
                    id: session.id,
                    title: session.title,
                    messages: [],
                    isLoaded: false,
                },
                ...prev,
            ];
        });
    }, []);

    const getSessionTitle = useCallback((chatId: string) => {
        return mergedSessionsRef.current.find((c) => c.id === chatId)?.title;
    }, []);

    const handleNewChat = useCallback(() => {
        setNewChatResetKey((prev) => prev + 1);
        router.push("/chat");
    }, [router]);

    const handleSelectChat = useCallback(
        (id: string) => {
            if (id.startsWith("temp-")) return;
            router.push(`/chat/${encodeURIComponent(id)}`);
        },
        [router],
    );

    const handleDeleteChat = useCallback(
        async (id: string) => {
            const index = mergedSessionsRef.current.findIndex(
                (c) => c.id === id,
            );
            if (index === -1) return;
            const target = mergedSessionsRef.current[index];

            if (!confirm(`'${target.title}' 채팅방을 삭제하시겠습니까?`))
                return;

            setChatSessions((prev) => prev.filter((c) => c.id !== id));
            useChatRuntimeStore.getState().clearRoomRuntime(id);

            if (
                window.location.pathname === `/chat/${encodeURIComponent(id)}`
            ) {
                router.replace("/chat");
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
                await handleApiError(
                    error,
                    "채팅방 삭제에 실패했습니다.",
                    true,
                );
            }
        },
        [handleApiError, router],
    );

    const clearChatState = useCallback(() => {
        skipNextPersistRef.current = true;
        setChatSessions([]);
        useChatRuntimeStore.getState().resetRuntime();
        if (window.location.pathname.startsWith("/chat/")) {
            router.replace("/chat");
        }
    }, [router]);

    return {
        chatSessions: mergedSessions,
        newChatResetKey,
        replyBanner,
        setReplyBanner,
        addSessionToSidebar,
        getSessionTitle,
        handleNewChat,
        handleSelectChat,
        handleDeleteChat,
        clearChatState,
    };
}
