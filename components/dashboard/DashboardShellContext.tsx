"use client";

import { createContext, useContext } from "react";
import type { ChatSession } from "@/types/dashboard";

export interface DashboardShellContextValue {
    /** 현재 로그인 사용자의 소속 회사명 */
    companyName?: string;
    /** 새 채팅 시작 시 입력창 초기화를 트리거하는 카운터 */
    newChatResetKey: number;
    /** 우측 파일 패널의 파일 선택 다이얼로그를 엽니다. */
    openFilePicker: () => void;
    /** 새 채팅방 생성 직후 좌측 사이드바 목록에 세션을 추가합니다. */
    addSessionToSidebar: (session: ChatSession) => void;
    /** 세션 ID로 사이드바에 등록된 대화방 제목을 조회합니다. */
    getSessionTitle: (chatId: string) => string | undefined;
    /** 설정 모달 열림 여부 참조 (알림 발송 판단용) */
    isSettingsOpenRef: React.RefObject<boolean>;
    /** 공통 API 에러 핸들러 (세션 만료 리다이렉트 포함) */
    handleApiError: (
        error: unknown,
        fallbackMessage: string,
        notify?: boolean,
    ) => Promise<boolean>;
}

const DashboardShellContext = createContext<DashboardShellContextValue | null>(
    null,
);

export const DashboardShellProvider = DashboardShellContext.Provider;

/**
 * 대시보드 공통 셸(`DashboardForm`)이 제공하는 액션과 상태를 하위 채팅 라우트에서 읽는 훅입니다.
 */
export function useDashboardShell(): DashboardShellContextValue {
    const ctx = useContext(DashboardShellContext);
    if (!ctx) {
        throw new Error(
            "useDashboardShell은 DashboardShellProvider 내부에서만 사용할 수 있습니다.",
        );
    }
    return ctx;
}
