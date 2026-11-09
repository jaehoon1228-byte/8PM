import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatSession } from "@/types/dashboard";

/** 사원별 대화방 목록을 보관하는 스토어의 상태 및 액션 */
interface ChatSessionState {
    /** 사원별 대화방 목록 (key: employeeId) */
    chatSessions: Record<number, ChatSession[]>;
    /**
     * 사원의 대화방 목록을 교체합니다.
     * @param employeeId 대상 사원 ID
     * @param sessions 저장할 대화방 목록
     */
    setChatSessions: (employeeId: number, sessions: ChatSession[]) => void;
    /**
     * 사원의 대화방 목록을 삭제합니다.
     * @param employeeId 삭제할 대상 사원 ID
     */
    removeChatSessions: (employeeId: number) => void;
}

/** 대화방 목록 스토어 (localStorage `mes-chat-sessions`에 persist) */
export const useChatSessionStore = create<ChatSessionState>()(
    persist(
        (set) => ({
            chatSessions: {},
            setChatSessions: (employeeId, sessions) =>
                set((state) => ({
                    chatSessions: {
                        ...state.chatSessions,
                        [employeeId]: sessions,
                    },
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

/**
 * 사원의 로컬 저장 대화방 목록을 조회합니다.
 * @param employeeId 조회할 사원 ID
 * @returns 저장된 대화방 목록 (없으면 빈 배열)
 */
export function getStoredChatSessions(employeeId: number): ChatSession[] {
    return useChatSessionStore.getState().chatSessions[employeeId] ?? [];
}

/**
 * 사원의 로컬 저장 대화방 목록을 저장합니다.
 * @param employeeId 저장할 사원 ID
 * @param sessions 저장할 대화방 목록
 */
export function setStoredChatSessions(
    employeeId: number,
    sessions: ChatSession[],
): void {
    useChatSessionStore.getState().setChatSessions(employeeId, sessions);
}

/**
 * 사원의 로컬 저장 대화방 목록을 삭제합니다.
 * @param employeeId 삭제할 사원 ID
 */
export function removeStoredChatSessions(employeeId: number): void {
    useChatSessionStore.getState().removeChatSessions(employeeId);
}
