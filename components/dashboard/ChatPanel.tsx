"use client";

// [렌더링 전략] CSR
//  - 입력창(타이핑)·전송·자동 높이 조절 등 브라우저 이벤트에 전적으로 의존하는 영역
//  - 입력값(input) 상태를 이 컴포넌트 내부에 두어, 타이핑할 때 사이드바/파일 목록까지
//    다시 렌더링되지 않도록 렌더링 범위를 최소화

import { useEffect, useRef, useState } from "react";
import { Bot, Paperclip, Send, User } from "lucide-react";
import type { ChatSession } from "@/types/dashboard";

interface ChatPanelProps {
    currentChat: ChatSession | undefined;
    companyName: string | undefined;
    /** 메시지 전송(응답 대기) 중 여부 → 중복 전송 차단 */
    isSending: boolean;
    /** 현재 보고 있는 채팅방이 응답을 기다리는 중인지 → 타이핑 표시 */
    isWaitingReply: boolean;
    isLoadingMessages: boolean;
    /** 값이 바뀌면 입력창을 비웁니다. (새 채팅 클릭 시) */
    resetKey: number;
    onSend: (text: string) => void;
    onOpenFilePicker: () => void;
}

const QUICK_PROMPTS = [
    "오늘 A라인 설비 가동률과 불량률 요약해줘",
    "업로드된 품질 데이터에서 주요 이상 항목 알려줘",
    "사내 휴가·지각·결근 규정 핵심만 정리해줘",
];

export default function ChatPanel({
    currentChat,
    companyName,
    isSending,
    isWaitingReply,
    isLoadingMessages,
    resetKey,
    onSend,
    onOpenFilePicker,
}: ChatPanelProps) {
    const [input, setInput] = useState("");
    const [prevResetKey, setPrevResetKey] = useState(resetKey);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    if (resetKey !== prevResetKey) {
        setPrevResetKey(resetKey);
        setInput("");
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [input]);

    const messageCount = currentChat?.messages.length ?? 0;
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messageCount, isWaitingReply]);

    const handleSubmit = (e?: React.SubmitEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isSending) return;

        onSend(input.trim());

        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <main className="flex-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-lg shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
            {!currentChat ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
                        MES AI Smart Factory Assistant
                    </span>
                    <h1 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                        {companyName ?? "한국제조 스마트팩토리"}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
                        공정 실적, 설비 가동률(OEE), 품질 불량 데이터 및 사내 문서를 기반으로
                        AI가 실시간 분석 답변을 제공합니다.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
                        {QUICK_PROMPTS.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                onClick={() => onSend(prompt)}
                                disabled={isSending}
                                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-500/15 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200/70 dark:border-slate-700/70 transition cursor-pointer"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 space-y-5 mb-4 custom-scrollbar">
                    {isLoadingMessages && currentChat.messages.length === 0 && (
                        <div className="flex items-center justify-center py-10">
                            <p className="text-slate-400 dark:text-slate-500 text-sm animate-pulse">
                                대화 내역을 불러오는 중...
                            </p>
                        </div>
                    )}
                    {currentChat.messages.map((msg) => {
                        const isUser = msg.sender === "user";
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 ${
                                    isUser ? "flex-row-reverse" : "flex-row"
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                                        isUser
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700"
                                    }`}
                                >
                                    {isUser ? (
                                        <User className="w-4 h-4" />
                                    ) : (
                                        <Bot className="w-4 h-4" />
                                    )}
                                </div>

                                <div
                                    className={`flex flex-col max-w-xl ${
                                        isUser ? "items-end" : "items-start"
                                    }`}
                                >
                                    <div
                                        className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap wrap-break-word ${
                                            isUser
                                                ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-md shadow-indigo-500/15"
                                                : "bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/70 dark:border-slate-700/70"
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {isWaitingReply && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="max-w-md px-4 py-3 rounded-2xl rounded-tl-xs text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70 animate-pulse">
                                MES 데이터를 분석하여 답변을 생성하고 있습니다...
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="w-full max-w-2xl relative flex items-end mx-auto gap-2.5 pt-2"
            >
                <button
                    type="button"
                    onClick={onOpenFilePicker}
                    className="p-3.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition-colors border border-slate-200/80 dark:border-slate-700 flex items-center justify-center cursor-pointer shrink-0"
                    title="분석용 문서 첨부 (.pdf, .docx, .xlsx, .pptx, .csv)"
                >
                    <Paperclip className="w-5 h-5" />
                </button>
                <div className="relative flex-1 flex items-center">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="공정 데이터, 설비 효율, 품질 현황 등 무엇이든 물어보세요..."
                        className="w-full bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl py-3.5 pl-5 pr-13 text-sm font-medium outline-none border border-slate-200/90 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-500/15 transition-all resize-none overflow-y-auto max-h-40 custom-scrollbar"
                    />
                    <button
                        type="submit"
                        disabled={isSending || !input.trim()}
                        className="absolute right-2.5 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-all rounded-xl cursor-pointer flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed shadow-sm"
                        title="질문 전송"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </main>
    );
}
