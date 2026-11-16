"use client";

import { BellRing, X } from "lucide-react";

export interface ReplyBanner {
    sessionId: string;
    title: string;
    preview: string;
}

interface ReplyToastBannerProps {
    banner: ReplyBanner | null;
    onSelectSession: (sessionId: string) => void;
    onDismiss: () => void;
}

/**
 * 다른 작업(다른 탭/대화방/설정창) 중 AI 답변이 도착했을 때 표시되는 인앱 토스트 배너입니다.
 */
export default function ReplyToastBanner({
    banner,
    onSelectSession,
    onDismiss,
}: ReplyToastBannerProps) {
    if (!banner) return null;

    return (
        <div className="fixed top-6 right-6 z-50 max-w-sm bg-slate-900 dark:bg-indigo-950 text-white rounded-2xl p-4 shadow-2xl border border-indigo-500/30 flex items-start gap-3 animate-bounce">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                <BellRing className="w-4 h-4" />
            </div>
            <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onSelectSession(banner.sessionId)}
            >
                <p className="text-xs font-bold text-indigo-300">
                    AI 답변 도착 · {banner.title}
                </p>
                <p className="text-xs text-slate-200 truncate mt-0.5">
                    {banner.preview}
                </p>
            </div>
            <button
                type="button"
                aria-label="알림 닫기"
                onClick={onDismiss}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
