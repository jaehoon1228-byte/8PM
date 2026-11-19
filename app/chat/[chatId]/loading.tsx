import { Loader2 } from "lucide-react";

/**
 * `/chat/[chatId]` 경로 전환 중 해당 채팅방의 대화 내역을 서버에서 불러오는 동안
 * 가운데 채팅 패널 영역에만 표시되는 로딩 UI입니다.
 */
export default function ChatRoomLoading() {
    return (
        <section className="flex-1 bg-white/90 dark:bg-slate-900/90 rounded-3xl flex flex-col items-center justify-center shadow-lg shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-sm font-medium">
                    대화 내역을 불러오는 중...
                </p>
            </div>
        </section>
    );
}
