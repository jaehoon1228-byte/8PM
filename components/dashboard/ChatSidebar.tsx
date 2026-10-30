"use client";

// [렌더링 전략] SSR 초기 데이터 + CSR 상호작용
//  - 채팅 목록은 서버(page.tsx)에서 미리 조회해 props 로 전달 → 첫 HTML 에 목록이 포함됨
//  - 새 채팅 / 채팅 선택 / 채팅방 삭제는 클릭 이벤트이므로 클라이언트에서 처리

import { MessageSquare, Plus, Trash2 } from "lucide-react";
import type { ChatSession } from "@/types/dashboard";

interface ChatSidebarProps {
    chatSessions: ChatSession[];
    activeChatId: string | null;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
}

export default function ChatSidebar({
    chatSessions,
    activeChatId,
    onNewChat,
    onSelectChat,
    onDeleteChat,
}: ChatSidebarProps) {
    return (
        <aside className="w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-5 flex flex-col shadow-lg shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800 shrink-0 transition-colors">
            <div className="px-2 mb-5">
                <p className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    MES AI Assistant
                </p>
                {/* <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Smart Factory Intelligence
                </p> */}
            </div>

            <button
                type="button"
                onClick={onNewChat}
                className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 mb-6 cursor-pointer active:scale-[0.99]"
            >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>새 채팅 시작</span>
            </button>

            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 px-2">
                <span>채팅 내역</span>
                <span className="text-[11px] font-semibold">
                    {chatSessions.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {chatSessions.length === 0 ? (
                    <div className="py-10 px-3 text-center">
                        <MessageSquare className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                        <p className="text-slate-400 dark:text-slate-500 text-xs">
                            이전 대화가 없습니다.
                        </p>
                    </div>
                ) : (
                    chatSessions.map((session) => {
                        const isActive = activeChatId === session.id;
                        return (
                            <div
                                key={session.id}
                                onClick={() => onSelectChat(session.id)}
                                className={`group w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl transition-all text-sm cursor-pointer ${
                                    isActive
                                        ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/70 dark:border-indigo-500/30 shadow-xs"
                                        : "hover:bg-slate-100/80 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent"
                                }`}
                                title={session.title}
                            >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <MessageSquare
                                        className={`w-4 h-4 shrink-0 ${
                                            isActive
                                                ? "text-indigo-600 dark:text-indigo-400"
                                                : "text-slate-400 dark:text-slate-500"
                                        }`}
                                    />
                                    <span className="truncate">
                                        {session.title}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteChat(session.id);
                                    }}
                                    className="opacity-70 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
                                    title="채팅방 삭제"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
}
