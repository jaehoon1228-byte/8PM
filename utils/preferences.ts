// =====================================================================
// 앱 환경설정(다크모드 / 푸시알림) & 권한 표기 & 브라우저 알림 유틸리티
// =====================================================================

const PREF_KEYS = {
    darkMode: "mes_pref_dark_mode",
    notifications: "mes_pref_notifications",
    lastLoginAt: "mes_security_last_login_at",
} as const;

export const PREFERENCES_EVENT = "mes-preferences-change";

export interface AppPreferences {
    darkMode: boolean;
    notifications: boolean;
}

export function getPreferences(): AppPreferences {
    if (typeof window === "undefined") {
        return { darkMode: false, notifications: true };
    }
    const darkRaw = localStorage.getItem(PREF_KEYS.darkMode);
    const notifRaw = localStorage.getItem(PREF_KEYS.notifications);
    return {
        darkMode: darkRaw === "true",
        notifications: notifRaw === null ? true : notifRaw === "true",
    };
}

export function applyThemeClass(darkMode: boolean): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", darkMode);
}

export function setDarkModePreference(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(PREF_KEYS.darkMode, String(enabled));
    applyThemeClass(enabled);
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
}

export async function setNotificationsPreference(enabled: boolean): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (enabled && "Notification" in window && Notification.permission === "default") {
        try {
            await Notification.requestPermission();
        } catch {
            // 권한 요청 실패 무시
        }
    }
    localStorage.setItem(PREF_KEYS.notifications, String(enabled));
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
    return enabled;
}

/**
 * Gemini 처럼 사용자가 질문을 던져놓고 다른 탭/창을 보고 있거나 설정 화면 등 다른 곳으로 이동했을 때
 * 푸시 알림이 켜져 있으면 데스크톱 알림 + 인앱 토스트 이벤트를 발생시킵니다.
 */
export function notifyChatResponseReady(sessionTitle: string, answerPreview: string): void {
    if (typeof window === "undefined") return;
    const { notifications } = getPreferences();
    if (!notifications) return;

    const isHiddenOrUnfocused =
        document.visibilityState === "hidden" || !document.hasFocus();

    const cleanPreview =
        answerPreview.replace(/\s+/g, " ").slice(0, 90) +
        (answerPreview.length > 90 ? "..." : "");

    // 다른 탭/창으로 이동해 있거나 브라우저가 백그라운드 상태일 때 OS 네이티브 알림 발송
    if (isHiddenOrUnfocused && "Notification" in window) {
        if (Notification.permission === "granted") {
            try {
                const n = new Notification(`MES AI 답변 완료 · ${sessionTitle}`, {
                    body: cleanPreview,
                    tag: "mes-ai-reply",
                });
                n.onclick = () => {
                    window.focus();
                    n.close();
                };
            } catch {
                // 일부 브라우저 환경 제한 무시
            }
        }
    }

    // 앱 내부에서 다른 대화방을 보고 있거나 백그라운드에서 돌아왔을 때를 위한 커스텀 이벤트
    window.dispatchEvent(
        new CustomEvent("mes-chat-reply-notification", {
            detail: { title: sessionTitle, preview: cleanPreview, wasBackground: isHiddenOrUnfocused },
        }),
    );
}

/** 권한 코드를 한국어 명칭으로 변환 (2-1 요구사항 반영) */
export function formatRoleLabel(role: string | undefined): string {
    if (!role) return "유저";
    const upper = role.toUpperCase();
    if (upper.includes("MASTER")) return "최고 관리자";
    if (upper.includes("MANAGER") || upper.includes("MANEGER")) return "관리자";
    if (upper.includes("USER")) return "유저";
    return role;
}

/** 계정 생성일자 포맷 (YYYY년 MM월 DD일) */
export function formatCreatedDate(dateStr?: string): string {
    if (!dateStr) return "2026년 06월 09일";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function recordLoginTimestamp(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(PREF_KEYS.lastLoginAt, new Date().toISOString());
}

export function getLastLoginTimestamp(): string {
    if (typeof window === "undefined") return "-";
    const raw = localStorage.getItem(PREF_KEYS.lastLoginAt);
    const d = raw ? new Date(raw) : new Date();
    return d.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}
