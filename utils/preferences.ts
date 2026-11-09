// =====================================================================
// 앱 환경설정(다크모드 / 푸시알림) & 권한 표기 & 브라우저 알림 유틸리티
// =====================================================================
import { ThemeMode, usePreferenceStore } from "@/utils/store/preferenceStore";

/** 환경설정이 바뀌었을 때 window 로 발생시키는 커스텀 이벤트 이름 */
export const PREFERENCES_EVENT = "mes-preferences-change";

/** 화면에서 사용하는 환경설정 값 */
export interface AppPreferences {
    /** 다크 모드 테마 */
    darkMode: ThemeMode;
    /** 푸시 알림 사용 여부 */
    notifications: boolean;
}

/**
 * 현재 환경설정 값을 조회합니다.
 * 서버 환경에서는 기본값을 반환합니다.
 * @returns 테마와 푸시 알림 설정
 */
export function getPreferences(): AppPreferences {
    if (typeof window === "undefined") {
        return { darkMode: ThemeMode.Light, notifications: true };
    }
    const { theme, notifications } = usePreferenceStore.getState();
    return {
        darkMode: theme,
        notifications,
    };
}

/**
 * html 요소의 `dark` 클래스를 테마에 맞춰 토글합니다.
 * 서버 환경에서는 아무 작업도 하지 않습니다.
 * @param darkMode 적용할 테마 (Dark 이면 `dark` 클래스 추가)
 */
export function applyThemeClass(darkMode: ThemeMode): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle(
        "dark",
        darkMode === ThemeMode.Dark,
    );
}

/**
 * 테마를 저장하고 html 클래스를 갱신한 뒤 PREFERENCES_EVENT를 발생시킵니다.
 * @param mode 설정할 테마
 */
export function setDarkModePreference(mode: ThemeMode): void {
    if (typeof window === "undefined") return;
    usePreferenceStore.getState().setTheme(mode);
    applyThemeClass(mode);
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
}

/**
 * 푸시 알림 설정을 저장합니다. 알림을 켤 때 브라우저 권한이 아직 `default` 이면 권한을 요청합니다.
 * 저장 후 PREFERENCES_EVENT 를 발생시킵니다.
 * @param enabled 푸시 알림 사용 여부
 * @returns 저장된 알림 사용 여부 (브라우저 환경이 아니면 false)
 */
export async function setNotificationsPreference(
    enabled: boolean,
): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (
        enabled &&
        "Notification" in window &&
        Notification.permission === "default"
    ) {
        try {
            await Notification.requestPermission();
        } catch {
            // 권한 요청 실패 무시
        }
    }
    usePreferenceStore.getState().setNotifications(enabled);
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
    return enabled;
}

/**
 * 사용자가 다른 탭/창을 보고 있거나 다른 화면으로 이동했을 때 AI 답변 완료를 알립니다.
 * 푸시 알림이 켜져 있으면 창이 숨겨졌거나 포커스가 없을 때 OS 데스크톱 알림을 보내고,
 * 항상 인앱 이벤트(`mes-chat-reply-notification`)를 발생시킵니다.
 * @param sessionTitle 답변이 완료된 대화방 제목
 * @param answerPreview 답변 원문 (90자까지 잘라서 미리보기로 사용)
 */
export function notifyChatResponseReady(
    sessionTitle: string,
    answerPreview: string,
): void {
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
                const n = new Notification(
                    `MES AI 답변 완료 · ${sessionTitle}`,
                    {
                        body: cleanPreview,
                        tag: "mes-ai-reply",
                    },
                );
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
            detail: {
                title: sessionTitle,
                preview: cleanPreview,
                wasBackground: isHiddenOrUnfocused,
            },
        }),
    );
}

/**
 * 권한 코드를 한국어 명칭으로 변환합니다 (2-1 요구사항 반영).
 * @param role 권한 코드 (예: ROLE_MASTER, ROLE_MANAGER, ROLE_USER)
 * @returns 한국어 권한 명칭. 값이 없으면 "사용자", 알 수 없는 코드는 원문을 그대로 반환
 */
export function formatRoleLabel(role: string | undefined): string {
    if (!role) return "사용자";
    const upper = role.toUpperCase();
    if (upper.includes("MASTER")) return "최고 관리자";
    if (upper.includes("MANAGER") || upper.includes("MANEGER")) return "관리자";
    if (upper.includes("USER")) return "사용자";
    return role;
}

/**
 * 계정 생성일자를 `YYYY년 MM월 DD일` 형식으로 변환합니다.
 * @param date 생성일자 (없으면 고정 기본 날짜를 반환)
 * @returns 한국어 형식의 날짜 문자열
 */
export function formatCreatedDate(date?: Temporal.PlainDateTime): string {
    if (!date) return "2026년 06월 09일";
    return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * 현재 시각을 마지막 로그인 시각으로 저장합니다. 서버 환경에서는 아무 작업도 하지 않습니다.
 */
export function recordLoginTimestamp(): void {
    if (typeof window === "undefined") return;
    usePreferenceStore
        .getState()
        .setLastLoginAt(Temporal.Now.plainDateTimeISO());
}

/**
 * 마지막 로그인 시각을 한국어 로케일(ko-KR) 날짜/시각 문자열로 조회합니다 (월, 일, 시, 분 표시).
 * 저장된 값이 없으면 현재 시각을 사용하며, 서버 환경에서는 `-` 를 반환합니다.
 * @returns 포맷된 마지막 로그인 시각 문자열
 */
export function getLastLoginTimestamp(): string {
    if (typeof window === "undefined") return "-";
    const lastLoginAt =
        usePreferenceStore.getState().lastLoginAt ??
        Temporal.Now.plainDateTimeISO();
    return lastLoginAt.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

