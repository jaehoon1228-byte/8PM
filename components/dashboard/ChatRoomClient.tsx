"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/dashboard/ChatPanel";
import { useDashboardShell } from "@/components/dashboard/DashboardShellContext";
import type { ChatSession, Message } from "@/types/dashboard";
import { askToLlm, createChatSession } from "@/utils/dashboardApi";
import { formatTime } from "@/utils/endpoints";
import { getPreferences, notifyChatResponseReady } from "@/utils/preferences";
import { useChatRuntimeStore } from "@/utils/store/chatRuntimeStore";
import { nowMs } from "@/utils/time";

interface ChatRoomClientProps {
    /** URL PathVariable의 채팅방 UUID (새 채팅 화면 `/`에서는 생략) */
    chatId?: string;
    /** 서버(SSR)에서 현재 `chatId`에 대해서만 조회한 대화 내역 */
    initialMessages?: Message[];
}

/**
 * 현재 경로(`/` 또는 `/chat/[chatId]`)에 해당하는 단일 채팅방의 메시지와 질의 전송을 담당합니다.
 * 다른 채팅방의 대화 내역은 메모리에 유지하지 않고, 경로 전환 시 현재 `chatId` 데이터만 표시합니다.
 */
export default function ChatRoomClient({
    chatId,
    initialMessages,
}: ChatRoomClientProps) {
    const router = useRouter();
    const {
        companyName,
        newChatResetKey,
        openFilePicker,
        addSessionToSidebar,
        getSessionTitle,
        isSettingsOpenRef,
        handleApiError,
    } = useDashboardShell();

    const [tempChatId, setTempChatId] = useState<string | null>(null);
    const effectiveChatId = chatId ?? tempChatId;

    const sendingChatId = useChatRuntimeStore((state) => state.sendingChatId);
    const roomRuntimeMessages = useChatRuntimeStore((state) =>
        effectiveChatId ? state.runtimeMessages[effectiveChatId] : undefined,
    );

    // 경로가 바뀌면 이전 채팅방의 완료된 런타임 메시지를 정리해 현재 chatId 데이터만 유지
    useEffect(() => {
        useChatRuntimeStore.getState().pruneInactiveRooms(chatId ?? null);
    }, [chatId]);

    const mergedMessages = useMemo(() => {
        const base = initialMessages ?? [];
        const runtime = roomRuntimeMessages ?? [];
        if (runtime.length === 0) return base;

        const baseIds = new Set(base.map((m) => m.id));
        const extra: Message[] = [];
        for (const msg of runtime) {
            if (baseIds.has(msg.id)) continue;
            if (
                msg.id.startsWith("user-") &&
                base.some((b) => b.sender === "user" && b.text === msg.text)
            ) {
                continue;
            }
            extra.push(msg);
        }
        return [...base, ...extra];
    }, [initialMessages, roomRuntimeMessages]);

    const currentChat: ChatSession | undefined = useMemo(() => {
        if (!effectiveChatId) return undefined;
        return {
            id: effectiveChatId,
            title: getSessionTitle(effectiveChatId) ?? "",
            messages: mergedMessages,
            isLoaded: true,
        };
    }, [effectiveChatId, getSessionTitle, mergedMessages]);

    const handleSend = useCallback(
        async (text: string) => {
            const store = useChatRuntimeStore.getState();
            if (store.sendingChatId !== null) return;

            const userMsg: Message = {
                id: `user-${nowMs()}`,
                text,
                sender: "user",
                timestamp: formatTime(),
            };

            const isNewSession = !chatId;
            const localChatId = chatId ?? `temp-${nowMs()}`;

            if (isNewSession) {
                setTempChatId(localChatId);
            }
            store.startPendingSend(localChatId, userMsg);

            let targetSessionId = localChatId;
            let sessionTitle = text;
            let sessionCreated = !isNewSession;

            try {
                if (isNewSession) {
                    const created = await createChatSession(text);
                    targetSessionId = created.id;
                    sessionTitle = created.title || text;
                    sessionCreated = true;

                    const createdMeta: ChatSession = {
                        id: created.id,
                        title: sessionTitle,
                        messages: [],
                        isLoaded: false,
                    };
                    useChatRuntimeStore
                        .getState()
                        .promoteTempSession(localChatId, createdMeta);
                    addSessionToSidebar(createdMeta);
                    router.replace(`/chat/${encodeURIComponent(created.id)}`);
                } else {
                    sessionTitle = getSessionTitle(localChatId) || text;
                }

                const answerMsg = await askToLlm(targetSessionId, text);
                useChatRuntimeStore
                    .getState()
                    .appendRuntimeMessage(targetSessionId, answerMsg);

                const prefs = getPreferences();
                const expectedPath = `/chat/${encodeURIComponent(targetSessionId)}`;
                const isAwayFromThisChat =
                    document.visibilityState === "hidden" ||
                    !document.hasFocus() ||
                    window.location.pathname !== expectedPath ||
                    isSettingsOpenRef.current;

                if (prefs.notifications && isAwayFromThisChat) {
                    notifyChatResponseReady(sessionTitle, answerMsg.text);
                    useChatRuntimeStore.getState().setReplyBanner({
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
                    useChatRuntimeStore
                        .getState()
                        .rollbackPendingSend(localChatId);
                    setTempChatId(null);
                } else if (!expired) {
                    const errorMsg: Message = {
                        id: `err-${nowMs()}`,
                        text: "답변을 받지 못했습니다. 잠시 후 다시 시도해주세요.",
                        sender: "bot",
                        timestamp: formatTime(),
                    };
                    useChatRuntimeStore
                        .getState()
                        .appendRuntimeMessage(targetSessionId, errorMsg);
                }
            } finally {
                useChatRuntimeStore.getState().finishPendingSend();
            }
        },
        [
            chatId,
            addSessionToSidebar,
            getSessionTitle,
            isSettingsOpenRef,
            handleApiError,
            router,
        ],
    );

    return (
        <ChatPanel
            currentChat={currentChat}
            companyName={companyName}
            isSending={sendingChatId !== null}
            isWaitingReply={
                sendingChatId !== null && sendingChatId === effectiveChatId
            }
            isLoadingMessages={false}
            resetKey={newChatResetKey}
            onSend={handleSend}
            onOpenFilePicker={openFilePicker}
        />
    );
}
