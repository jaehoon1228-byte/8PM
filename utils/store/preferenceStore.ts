import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { parseOptionalDateTime } from "@/utils/time";

/** 화면 테마 모드 */
export enum ThemeMode {
    Light = "light",
    Dark = "dark",
}

/** 사용자 환경설정 스토어의 상태 및 액션 */
interface PreferenceState {
    /** 현재 테마 */
    theme: ThemeMode;
    /** 푸시 알림 사용 여부 */
    notifications: boolean;
    /** 마지막 로그인 시각 (타임존 없는 PlainDateTime) */
    lastLoginAt: Temporal.PlainDateTime | null;
    /**
     * 테마를 변경합니다.
     * @param theme 적용할 테마
     */
    setTheme: (theme: ThemeMode) => void;
    /**
     * 푸시 알림 사용 여부를 변경합니다.
     * @param enabled 사용 여부
     */
    setNotifications: (enabled: boolean) => void;
    /**
     * 마지막 로그인 시각을 저장합니다.
     * @param dateTime 로그인 시각
     */
    setLastLoginAt: (dateTime: Temporal.PlainDateTime) => void;
}

/** localStorage 저장 포맷 (PlainDateTime 은 ISO 문자열로 저장) */
interface PersistedPreferenceState {
    theme: ThemeMode;
    notifications: boolean;
    lastLoginAt: string | null;
}

/**
 * 테마 / 푸시 알림 / 마지막 로그인 시각 스토어 (localStorage `mes-preferences`에 persist)
 * 브라우저 단위로 저장되며 사용자 구분은 없습니다.
 */
export const usePreferenceStore = create<PreferenceState>()(
    persist(
        (set) => ({
            theme: ThemeMode.Light,
            notifications: true,
            lastLoginAt: null,
            setTheme: (theme) => set({ theme }),
            setNotifications: (enabled) => set({ notifications: enabled }),
            setLastLoginAt: (dateTime) => set({ lastLoginAt: dateTime }),
        }),
        {
            name: "mes-preferences",
            storage: createJSONStorage(() => localStorage),
            partialize: (state): PersistedPreferenceState => ({
                theme: state.theme,
                notifications: state.notifications,
                lastLoginAt: state.lastLoginAt?.toString() ?? null,
            }),
            merge: (persisted, current) => {
                // JSON 파싱 결과는 타입이 없으므로 저장 포맷으로 단언
                const saved = persisted as PersistedPreferenceState | undefined;
                return {
                    ...current,
                    theme: saved?.theme ?? current.theme,
                    notifications:
                        saved?.notifications ?? current.notifications,
                    lastLoginAt:
                        parseOptionalDateTime(saved?.lastLoginAt) ?? null,
                };
            },
        },
    ),
);
