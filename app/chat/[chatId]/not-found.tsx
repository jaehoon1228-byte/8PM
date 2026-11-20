import Link from "next/link";
import { MessageSquareOff } from "lucide-react";

/**
 * 존재하지 않거나 접근 권한이 없는 `chatId`로 `/chat/[chatId]`에 접근했을 때 표시되는 404 화면입니다.
 */
export default function ChatRoomNotFound() {
    return (
        <section className="flex-1 bg-white/90 dark:bg-slate-900/90 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-lg shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-4">
                <MessageSquareOff className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
                채팅방을 찾을 수 없습니다
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
                요청하신 대화방이 삭제되었거나 접근 권한이 없습니다.
            </p>
            <Link
                href="/chat"
                className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition"
            >
                새 채팅으로 돌아가기
            </Link>
        </section>
    );
}
