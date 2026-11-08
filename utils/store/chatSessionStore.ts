import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatSession } from "@/types/dashboard";

interface ChatSessionState {
    /** 사원별 대화방 목록 (key: employeeId) */
    chatSessions: Record<number, ChatSession[]>;
    setChatSessions: (employeeId: number, sessions: ChatSession[]) => void;
    removeChatSessions: (employeeId: number) => void;
}

export const useChatSessionStore = create<ChatSessionState>()(
    persist(
        (set) => ({
            chatSessions: {},
            setChatSessions: (employeeId, sessions) =>
                set((state) => ({
                    chatSessions: { ...state.chatSessions, [employeeId]: sessions },
                })),
            removeChatSessions: (employeeId) =>
                set((state) => {
                    const next = { ...state.chatSessions };
                    delete next[employeeId];
                    return { chatSessions: next };
                }),
        }),
        {
            name: "mes-chat-sessions",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

/** 사원의 로컬 저장 대화방 목록 조회 */
export function getStoredChatSessions(employeeId: number): ChatSession[] {
    return useChatSessionStore.getState().chatSessions[employeeId] ?? [];
}

/** 사원의 로컬 저장 대화방 목록 저장 */
export function setStoredChatSessions(
    employeeId: number,
    sessions: ChatSession[],
): void {
    useChatSessionStore.getState().setChatSessions(employeeId, sessions);
}

/** 사원의 로컬 저장 대화방 목록 삭제 */
export function removeStoredChatSessions(employeeId: number): void {
    useChatSessionStore.getState().removeChatSessions(employeeId);
}
