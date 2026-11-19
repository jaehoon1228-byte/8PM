import { create } from "zustand";
import type { ReplyBanner } from "@/components/dashboard/ReplyToastBanner";
import type { ChatSession, Message } from "@/types/dashboard";

/**
 * 라우트 전환(`/` ↔ `/chat/[chatId]`) 중 진행 중인 LLM 질의 및
 * 방금 송수신된 메시지를 끊김 없이 이어주기 위한 인메모리 런타임 스토어 상태입니다.
 */
interface ChatRuntimeState {
    /** 현재 AI 응답을 기다리고 있는 채팅방 ID (새 방 생성 중에는 `temp-...`) */
    sendingChatId: string | null;
    /** 현재 방 또는 전송 중인 방에서 클라이언트 세션 동안 추가된 메시지 (key: chatId) */
    runtimeMessages: Record<string, Message[]>;
    /** 방금 생성되어 사이드바 목록에 반영되어야 하는 세션 메타데이터 */
    pendingSessions: ChatSession[];
    /** 다른 화면/대화방에 있을 때 AI 답변 도착을 알리는 인앱 토스트 배너 */
    replyBanner: ReplyBanner | null;
    /** 전송 시작 시 낙관적 사용자 메시지를 기록합니다. */
    startPendingSend: (chatId: string, userMsg: Message) => void;
    /** 새 채팅방 생성 성공 시 임시 ID(`temp-...`)를 실제 서버 UUID로 승격합니다. */
    promoteTempSession: (tempId: string, createdSession: ChatSession) => void;
    /** 해당 채팅방에 새 메시지(AI 답변 또는 에러 메시지)를 추가합니다. */
    appendRuntimeMessage: (chatId: string, message: Message) => void;
    /** 전송 대기 상태를 종료합니다. */
    finishPendingSend: () => void;
    /** 새 채팅방 생성 실패 시 임시 상태를 롤백합니다. */
    rollbackPendingSend: (tempId: string) => void;
    /** 다른 채팅방으로 이동 시 현재 방과 전송 중인 방을 제외한 이전 런타임 메시지를 정리합니다. */
    pruneInactiveRooms: (keepChatId: string | null) => void;
    /** 특정 채팅방의 런타임 메시지와 대기 세션 항목을 제거합니다. */
    clearRoomRuntime: (chatId: string) => void;
    /** 인앱 답변 도착 배너 상태를 설정합니다. */
    setReplyBanner: (banner: ReplyBanner | null) => void;
    /** 모든 런타임 상태를 초기화합니다. */
    resetRuntime: () => void;
}

export const useChatRuntimeStore = create<ChatRuntimeState>()((set) => ({
    sendingChatId: null,
    runtimeMessages: {},
    pendingSessions: [],
    replyBanner: null,

    startPendingSend: (chatId, userMsg) =>
        set((state) => ({
            sendingChatId: chatId,
            runtimeMessages: {
                ...state.runtimeMessages,
                [chatId]: [...(state.runtimeMessages[chatId] ?? []), userMsg],
            },
        })),

    promoteTempSession: (tempId, createdSession) =>
        set((state) => {
            const tempMessages = state.runtimeMessages[tempId] ?? [];
            const nextMessages = { ...state.runtimeMessages };
            delete nextMessages[tempId];
            nextMessages[createdSession.id] = [
                ...(nextMessages[createdSession.id] ?? []),
                ...tempMessages,
            ];

            const exists = state.pendingSessions.some(
                (s) => s.id === createdSession.id,
            );
            return {
                sendingChatId:
                    state.sendingChatId === tempId
                        ? createdSession.id
                        : state.sendingChatId,
                runtimeMessages: nextMessages,
                pendingSessions: exists
                    ? state.pendingSessions
                    : [
                          {
                              id: createdSession.id,
                              title: createdSession.title,
                              messages: [],
                              isLoaded: false,
                          },
                          ...state.pendingSessions,
                      ],
            };
        }),

    appendRuntimeMessage: (chatId, message) =>
        set((state) => {
            const existing = state.runtimeMessages[chatId] ?? [];
            if (existing.some((m) => m.id === message.id)) {
                return state;
            }
            return {
                runtimeMessages: {
                    ...state.runtimeMessages,
                    [chatId]: [...existing, message],
                },
            };
        }),

    finishPendingSend: () => set({ sendingChatId: null }),

    rollbackPendingSend: (tempId) =>
        set((state) => {
            const nextMessages = { ...state.runtimeMessages };
            delete nextMessages[tempId];
            return {
                sendingChatId:
                    state.sendingChatId === tempId ? null : state.sendingChatId,
                runtimeMessages: nextMessages,
            };
        }),

    pruneInactiveRooms: (keepChatId) =>
        set((state) => {
            const nextMessages: Record<string, Message[]> = {};
            for (const [roomId, msgs] of Object.entries(
                state.runtimeMessages,
            )) {
                if (roomId === keepChatId || roomId === state.sendingChatId) {
                    nextMessages[roomId] = msgs;
                }
            }
            return { runtimeMessages: nextMessages };
        }),

    clearRoomRuntime: (chatId) =>
        set((state) => {
            const nextMessages = { ...state.runtimeMessages };
            delete nextMessages[chatId];
            return {
                runtimeMessages: nextMessages,
                pendingSessions: state.pendingSessions.filter(
                    (s) => s.id !== chatId,
                ),
            };
        }),

    setReplyBanner: (banner) => set({ replyBanner: banner }),

    resetRuntime: () =>
        set({
            sendingChatId: null,
            runtimeMessages: {},
            pendingSessions: [],
            replyBanner: null,
        }),
}));
