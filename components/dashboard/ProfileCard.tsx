"use client";

// [렌더링 전략] SSR (서버에서 받은 사용자 정보로 첫 HTML 완성)
//  - 우측 상단 원형 버튼을 누르면 계정 정보 / 앱 설정 / 기타가 담긴 설정 모달을 표시

import { Settings } from "lucide-react";
import type { UserInfo } from "@/types/dashboard";
import { formatRoleLabel } from "@/utils/preferences";

interface ProfileCardProps {
    userInfo: UserInfo | undefined;
    onOpenSettings: () => void;
}

export default function ProfileCard({ userInfo, onOpenSettings }: ProfileCardProps) {
    const initial = userInfo?.username ? userInfo.username.charAt(0) : "사";
    const roleLabel = formatRoleLabel(userInfo?.role);

    return (
        <aside
            onClick={onOpenSettings}
            className="w-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-xl transition-all rounded-3xl p-5 shadow-lg shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center text-left cursor-pointer group"
            title="계정 정보 및 환경 설정 열기"
        >
            <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                    <p className="text-slate-900 dark:text-white font-bold text-[15px] truncate">
                        {userInfo?.username ?? "사원"}님 환영합니다.
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        {roleLabel}
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
                        사번: {userInfo?.employeeId ?? "-"}
                    </p>
                </div>
            </div>

            {/* 우측 상단 원형 아바타 버튼 */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenSettings();
                }}
                className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-base flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform shrink-0 cursor-pointer"
                title="계정 정보 · 앱 설정 · 기타"
            >
                <span>{initial}</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs">
                    <Settings className="w-2.5 h-2.5" />
                </span>
            </button>
        </aside>
    );
}
