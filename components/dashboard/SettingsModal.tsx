"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Cpu,
    Info,
    KeyRound,
    LogOut,
    Moon,
    RefreshCw,
    ShieldCheck,
    Trash2,
    User,
    X,
} from "lucide-react";
import type { UserInfo } from "@/types/dashboard";
import { api } from "@/utils/api";
import { logout } from "@/utils/dashboardApi";
import {
    formatCreatedDate,
    formatRoleLabel,
    getLastLoginTimestamp,
    getPreferences,
    PREFERENCES_EVENT,
    setDarkModePreference,
    setNotificationsPreference,
} from "@/utils/preferences";

type SettingsView = "main" | "account" | "security";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userInfo: UserInfo | undefined;
    onClearLocalCache?: () => void;
}

export default function SettingsModal({
    isOpen,
    onClose,
    userInfo,
    onClearLocalCache,
}: SettingsModalProps) {
    const router = useRouter();
    const [view, setView] = useState<SettingsView>("main");
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // 2-2 보안 탭 상태
    const [tokenState, setTokenState] = useState<
        "idle" | "checking" | "valid" | "expired"
    >("idle");
    const [lastVerifiedAt, setLastVerifiedAt] = useState<string>("-");
    const [notifPermission, setNotifPermission] = useState<string>("default");

    useEffect(() => {
        const syncPrefs = () => {
            const prefs = getPreferences();
            setDarkMode(prefs.darkMode);
            setNotifications(prefs.notifications);
            if (typeof window !== "undefined" && "Notification" in window) {
                setNotifPermission(Notification.permission);
            }
        };
        syncPrefs();
        window.addEventListener(PREFERENCES_EVENT, syncPrefs);
        return () => window.removeEventListener(PREFERENCES_EVENT, syncPrefs);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        setView("main");
        onClose();
    };

    const handleToggleNotifications = async () => {
        const next = !notifications;
        setNotifications(next);
        await setNotificationsPreference(next);
        if (typeof window !== "undefined" && "Notification" in window) {
            setNotifPermission(Notification.permission);
        }
    };

    const handleToggleDarkMode = () => {
        const next = !darkMode;
        setDarkMode(next);
        setDarkModePreference(next);
    };

    const handleVerifySession = async () => {
        setTokenState("checking");
        try {
            await api.get("/api/v1/users/me");
            setTokenState("valid");
            setLastVerifiedAt(new Date().toLocaleTimeString("ko-KR"));
        } catch {
            setTokenState("expired");
        }
    };

    const handleClearBrowserCache = () => {
        if (!userInfo?.employeeId) return;
        if (
            !confirm(
                "이 브라우저에 캐시된 로컬 대화방 및 파일 목록 기록을 초기화하시겠습니까?",
            )
        ) {
            return;
        }
        localStorage.removeItem(`mes_chat_sessions_${userInfo.employeeId}`);
        localStorage.removeItem(`mes_uploaded_files_${userInfo.employeeId}`);
        onClearLocalCache?.();
        alert("브라우저 로컬 캐시가 초기화되었습니다.");
    };

    const handleLogout = async () => {
        if (!confirm("정말 로그아웃 하시겠습니까?")) return;
        await logout();
        router.push("/login");
    };

    const roleLabel = formatRoleLabel(userInfo?.role);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 상단 헤더 */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                    <div className="flex items-center gap-2.5">
                        {view !== "main" && (
                            <button
                                type="button"
                                onClick={() => setView("main")}
                                className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="뒤로"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                {view === "main" && "환경 설정"}
                                {view === "account" && "내 정보 관리"}
                                {view === "security" && "비밀번호 및 보안"}
                            </h2>
                            {/* <p className="text-xs text-slate-500 dark:text-slate-400">
                                {view === "main" &&
                                    "계정 정보, 알림 및 화면 테마를 관리합니다."}
                                {view === "account" &&
                                    "현재 로그인된 사원 계정 상세 프로필입니다."}
                                {view === "security" &&
                                    "JWT 인증 세션, 보안 토큰 및 기기 데이터를 관리합니다."}
                            </p> */}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="닫기"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 본문 영역 */}
                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {view === "main" && (
                        <>
                            {/* 1. 계정 정보 */}
                            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
                                    계정 정보
                                </h3>
                                <div className="space-y-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setView("account")}
                                        className="w-full flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition text-left cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                    내 정보 관리
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    내 정보를 확인할 수
                                                    있습니다.
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                    {/* <button
                                        type="button"
                                        onClick={() => setView("security")}
                                        className="w-full flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition text-left cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                    비밀번호 및 보안
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    계정의 보안 관련 설정을
                                                    변경할 수 있습니다.
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </button> */}
                                </div>
                            </div>

                            {/* 2. 앱 설정 */}
                            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
                                    앱 설정
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-slate-800/60">
                                        <div className="flex items-center gap-3 pr-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                <Bell className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                    푸시 알림
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    답변이 완료되면 알림을
                                                    받습니다.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleToggleNotifications}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${
                                                notifications
                                                    ? "bg-indigo-600"
                                                    : "bg-slate-300 dark:bg-slate-700"
                                            }`}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                                                    notifications
                                                        ? "translate-x-6"
                                                        : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-slate-800/60">
                                        <div className="flex items-center gap-3 pr-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                <Moon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                    다크 모드
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    어두운 테마로 전환합니다.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleToggleDarkMode}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${
                                                darkMode
                                                    ? "bg-indigo-600"
                                                    : "bg-slate-300 dark:bg-slate-700"
                                            }`}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                                                    darkMode
                                                        ? "translate-x-6"
                                                        : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 3. 기타 */}
                            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
                                    기타
                                </h3>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-slate-800/60">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                앱 버전 정보
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                MES AI ChatBot Web
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                        v1.0.0
                                    </span>
                                </div>
                            </div>

                            {/* 하단 로그아웃 버튼 */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer border border-rose-200/60 dark:border-rose-500/20"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>로그아웃</span>
                            </button>
                        </>
                    )}

                    {/* 2-1. 내 정보 관리 뷰 */}
                    {view === "account" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-md">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-extrabold">
                                    {userInfo?.username
                                        ? userInfo.username.charAt(0)
                                        : "사"}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-bold">
                                            {userInfo?.username ?? "사원"}
                                        </h4>
                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20">
                                            {roleLabel}
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-100 mt-0.5">
                                        {userInfo?.companyName ??
                                            "MES 스마트팩토리"}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                                <ProfileRow
                                    label="이름"
                                    value={userInfo?.username ?? "-"}
                                />
                                <ProfileRow
                                    label="회사 일련번호"
                                    value={
                                        userInfo?.companyId !== undefined
                                            ? String(userInfo.companyId)
                                            : "-"
                                    }
                                />
                                <ProfileRow
                                    label="사원번호"
                                    value={
                                        userInfo?.employeeId !== undefined
                                            ? String(userInfo.employeeId)
                                            : "-"
                                    }
                                />
                                <ProfileRow
                                    label="이메일"
                                    value={userInfo?.email ?? "-"}
                                />
                                <ProfileRow
                                    label="권한 등급"
                                    value={roleLabel}
                                    subValue={
                                        userInfo?.role
                                            ? `(${userInfo.role})`
                                            : undefined
                                    }
                                    highlight
                                />
                                <ProfileRow
                                    label="계정 생성일자"
                                    value={formatCreatedDate(
                                        userInfo?.createdAt,
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {/* 2-2. 비밀번호 및 보안 뷰 (비밀번호 변경 제외, 실용적인 보안/세션 관리 기능 제공) */}
                    {view === "security" && (
                        <div className="space-y-4">
                            {/* 1) 현재 보안 인증 프로토콜 및 세션 상태 */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        <span className="text-sm font-bold">
                                            JWT 인증 및 보안 프로토콜 상태
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        보호됨
                                    </span>
                                </div>

                                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            암호화 알고리즘
                                        </span>
                                        <span className="font-medium">
                                            Argon2 + HMAC-SHA512 JWT
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            Refresh 토큰 보관
                                        </span>
                                        <span className="font-medium">
                                            HttpOnly 쿠키 + Redis 화이트리스트
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            접속 권한 인가
                                        </span>
                                        <span className="font-medium">
                                            {roleLabel}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            최근 접속 시각
                                        </span>
                                        <span className="font-medium">
                                            {getLastLoginTimestamp()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            브라우저 알림 권한
                                        </span>
                                        <span className="font-medium">
                                            {notifPermission === "granted"
                                                ? "허용됨"
                                                : notifPermission === "denied"
                                                  ? "차단됨"
                                                  : "기본(요청 대기)"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 2) 실시간 토큰 유효성 검증 & 재발급 점검 */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <KeyRound className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold">
                                                Access Token 실시간 유효성 점검
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                백엔드 서버와 통신하여 현재 인증
                                                토큰 및 자동 재발급 상태를 즉시
                                                검증합니다.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleVerifySession}
                                        disabled={tokenState === "checking"}
                                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            className={`w-3.5 h-3.5 ${
                                                tokenState === "checking"
                                                    ? "animate-spin"
                                                    : ""
                                            }`}
                                        />
                                        <span>점검</span>
                                    </button>
                                </div>

                                {tokenState !== "idle" && (
                                    <div
                                        className={`text-xs px-3 py-2 rounded-xl flex items-center justify-between ${
                                            tokenState === "valid"
                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                                : tokenState === "expired"
                                                  ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300"
                                                  : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300"
                                        }`}
                                    >
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {tokenState === "checking" &&
                                                "백엔드 인증 서버 확인 중..."}
                                            {tokenState === "valid" &&
                                                "정상: Access Token 및 Refresh 쿠키가 유효합니다."}
                                            {tokenState === "expired" &&
                                                "만료됨: 다시 로그인이 필요합니다."}
                                        </span>
                                        <span className="text-[11px] opacity-80 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {lastVerifiedAt}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 3) 공용 PC 보호용 로컬 캐시 데이터 삭제 */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-4 flex items-center justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                    <Cpu className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold">
                                            브라우저 로컬 작업 캐시 초기화
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            공용 작업장 PC 사용 시 이 브라우저에
                                            남은 대화방/파일 목록 캐시를 즉시
                                            삭제합니다.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearBrowserCache}
                                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>초기화</span>
                                </button>
                            </div>

                            {/* 4) 서버 Refresh Token 영구 폐기 및 보안 로그아웃 */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>
                                    서버 Refresh Token 폐기 및 즉시 보안
                                    로그아웃
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProfileRow({
    label,
    value,
    subValue,
    highlight,
}: {
    label: string;
    value: string;
    subValue?: string;
    highlight?: boolean;
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3.5 text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
                {label}
            </span>
            <div className="text-right">
                <span
                    className={
                        highlight
                            ? "font-bold text-indigo-600 dark:text-indigo-400"
                            : "font-semibold text-slate-900 dark:text-slate-100"
                    }
                >
                    {value}
                </span>
                {subValue && (
                    <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">
                        {subValue}
                    </span>
                )}
            </div>
        </div>
    );
}
