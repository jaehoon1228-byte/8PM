"use client";

import { api } from "@/utils/api";
import { isHTTPError } from "ky";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface Message {
    id: number;
    text: string;
    sender: "user" | "bot";
    timestamp: string;
}

interface ChatSession {
    id: number;
    title: string;
    messages: Message[];
}

interface UserInfo {
    companyId: number;
    companyName: number;
    employeeId: number;
    username: string;
    email: string;
    role: string;
}

interface UploadedFile {
    id: number;
    name: string;
    size: string;
}

export default function DashboardForm() {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();
    const [input, setInput] = useState("");

    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const currentChat = chatSessions.find((chat) => chat.id === activeChatId);

    const [userInfo, setUserInfo] = useState<UserInfo | undefined>(undefined);

    useEffect(() => {
        const fetchMyInfo = async () => {
            try {
                const request = await api.get("/api/v1/users/me");
                const response = await request.json<UserInfo>();
                setUserInfo(response);
            } catch (error) {
                if (isHTTPError(error)) {
                    console.error(
                        "통신 에러가 발생했습니다.",
                        error.message,
                    );
                } else {
                    console.error("Unknown error: ", error);
                }
            }
        };
    
        fetchMyInfo();
    }, []);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [input]);

    const handleOpenFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const newFiles: UploadedFile[] = Array.from(files).map((file, idx) => ({
            id: Date.now() + idx,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        }));
        setUploadedFiles((prev) => [...newFiles, ...prev]);
        e.target.value = "";
    };

    const handleRemoveFile = (id: number) => {
        setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
    }

    const handleLogout = async () => {
        try {
            await api.post("/api/v1/logout");
        } catch (error) {
            console.error("로그아웃 실패:", error);
        } finally {
            router.push("/");
        }
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setInput("");
    };

    const handleSelectChat = (id: number) => {
        setActiveChatId(id);
    };

    const handleSubmit = (e?: React.SubmitEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const newMsg: Message = {
            id: Date.now(),
            text: input.trim(),
            sender: "user",
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        if (activeChatId === null) {
            const newSessionId = Date.now();
            const newSession: ChatSession = {
                id: newSessionId,
                title: input.trim(),
                messages: [newMsg],
            };

            setChatSessions((prev) => [newSession, ...prev]);
            setActiveChatId(newSessionId);
        } else {
            setChatSessions((prev) =>
                prev.map((chat) =>
                    chat.id === activeChatId
                        ? { ...chat, messages: [...chat.messages, newMsg] }
                        : chat,
                ),
            );
        }

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
        <div className="flex h-screen w-full bg-[#7C8CEE] p-6 gap-6 relative overflow-hidden font-sans box-border">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
            />

            <aside className="w-64 bg-[#8C9CFF] rounded-3xl p-5 flex flex-col shadow-inner border border-white/20 shrink-0">
                <button
                    onClick={handleNewChat}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm mb-6 cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                    </svg>
                    <span>새 채팅</span>
                </button>

                <div className="text-white/90 text-base font-semibold mb-3 px-1">
                    채팅 내역
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {chatSessions.length === 0 ? (
                        <p className="text-white/60 text-xs px-1">이전 대화가 없습니다.</p>
                    ) : (
                        chatSessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => handleSelectChat(session.id)}
                                className={`w-full text-left p-3 rounded-xl truncate transition-colors text-sm cursor-pointer ${
                                    activeChatId === session.id
                                        ? "bg-white/30 text-white font-semibold"
                                        : "bg-white/10 hover:bg-white/20 text-white/90"
                                }`}
                                title={session.title}
                            >
                                {session.title}
                            </button>
                        ))
                    )}
                </div>
            </aside>

            <main className="flex-1 bg-[#A1B0FF] rounded-3xl p-8 flex flex-col justify-between relative shadow-sm border border-white/10 overflow-hidden">
                {!currentChat ? (
                    <div className="flex-1 flex items-center justify-center">
                        <h1 className="text-white text-4xl font-bold tracking-wide">
                            {userInfo?.companyName}
                        </h1>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 custom-scrollbar">
                        {currentChat.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${
                                    msg.sender === "user" ? "items-end" : "items-start"
                                }`}
                            >
                                <div
                                    className={`max-w-md px-5 py-3 rounded-2xl text-sm whitespace-pre-wrap wrap-break-word ${
                                        msg.sender === "user"
                                            ? "bg-indigo-600 text-white rounded-br-none shadow-md"
                                            : "bg-white text-gray-800 rounded-bl-none shadow-md"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-xl relative flex items-center mx-auto gap-2"
                >
                    <button
                        type="button"
                        onClick={handleOpenFilePicker}
                        className="p-3 bg-[#E5E7EB] hover:bg-gray-300 text-gray-700 rounded-2xl transition-colors shadow-md flex items-center justify-center cursor-pointer shrink-0"
                        title="파일첨부"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94a3 3 0 114.243 4.243L8.587 18.292a1.5 1.5 0 01-2.122-2.122l8.835-8.835"
                            />
                        </svg>
                    </button>
                    <div className="relative flex-1 flex items-center">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="무엇이든 물어보세요."
                            className="w-full bg-[#E5E7EB] text-gray-800 placeholder-gray-500 rounded-2xl py-3.5 pl-6 pr-14 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all shadow-md resize-none overflow-y-auto max-h-40 custom-scrollbar"
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-gray-700 hover:text-black transition-colors rounded-full hover:bg-gray-300/50 cursor-pointer flex items-center justify-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5 -rotate-45"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                />
                            </svg>
                        </button>
                    </div>
                </form>
            </main>

            <div className="w-72 flex flex-col gap-6 shrink-0">
                <aside
                    onClick={() => router.push("/settings")}
                    className="w-full bg-[#8C9CFF] hover:bg-[#7b8ce8] transition-colors rounded-3xl p-5 shadow-inner border border-white/20 flex justify-between items-center text-left cursor-pointer group"
                >
                    <div>
                        <p className="text-black font-medium text-base">
                            {userInfo?.username}님 환영합니다.
                        </p>
                        <p className="text-black/80 text-xs mt-1">
                            사원번호: {userInfo?.employeeId}
                        </p>
                    </div>
                    <div className="w-8 h-8 bg-white/80 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors shrink-0" />
                </aside>

                <aside className="flex-1 bg-[#8C9CFF] rounded-3xl p-5 shadow-inner border border-white/20 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-black font-bold text-base">내가 올린 파일</h2>
                        <span className="text-xs text-black/60 font-medium">
                            {uploadedFiles.length}개
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {uploadedFiles.length === 0 ? (
                            <p className="text-black/50 text-xs py-2">
                                업로드된 파일이 없습니다.
                            </p>
                        ) : (
                            uploadedFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl flex items-center justify-between gap-2 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.8}
                                            stroke="currentColor"
                                            className="w-5 text-black/70 shrink-0"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                            />
                                        </svg>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-black font-medium truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-[10px] text-black/60">{file.size}</p>
                                        </div>
                                    </div>

                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFile(file.id);
                                        }}
                                        className="text-black/40 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                                        title="삭제"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
