import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { parseOptionalDateTime } from "@/utils/time";

export enum ThemeMode {
    Light = "light",
    Dark = "dark",
}

interface PreferenceState {
    theme: ThemeMode;
    notifications: boolean;
    /** 마지막 로그인 시각 (타임존 없는 PlainDateTime) */
    lastLoginAt: Temporal.PlainDateTime | null;
    setTheme: (theme: ThemeMode) => void;
    setNotifications: (enabled: boolean) => void;
    setLastLoginAt: (dateTime: Temporal.PlainDateTime) => void;
}

/** localStorage 저장 포맷 (PlainDateTime 은 ISO 문자열로 저장) */
interface PersistedPreferenceState {
    theme: ThemeMode;
    notifications: boolean;
    lastLoginAt: string | null;
}

/** 테마 / 푸시 알림 / 마지막 로그인 시각 (브라우저 단위, 사용자 구분 없음) */
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
                    notifications: saved?.notifications ?? current.notifications,
                    lastLoginAt: parseOptionalDateTime(saved?.lastLoginAt) ?? null,
                };
            },
        },
    ),
);
