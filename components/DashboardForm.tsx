'use client';

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
}

export default function DashboardForm() {
  const router = useRouter();
  const [input, setInput] = useState('');

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentChat = chatSessions.find((chat) => chat.id === activeChatId);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleLogout = () => {
    router.push('/login');
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setInput('');
  };

  const handleSelectChat = (id: number) => {
    setActiveChatId(id);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const newMsg: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
            : chat
        )
      );
    }

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#7C8CEE] p-6 gap-6 relative overflow-hidden font-sans box-border">
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
                    ? 'bg-white/30 text-white font-semibold'
                    : 'bg-white/10 hover:bg-white/20 text-white/90'
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
              회사명
            </h1>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 custom-scrollbar">
            {currentChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-md px-5 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-xl relative flex items-center mx-auto">
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
        </form>
      </main>

      <aside className="w-72 bg-[#8C9CFF] rounded-3xl p-6 flex flex-col justify-between shadow-inner border border-white/20 shrink-0 relative">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-black font-medium text-base">OOO님 환영합니다.</p>
              <p className="text-black/80 text-xs mt-1">사원번호 : OOOOOOOO</p>
            </div>
            <div className="w-8 h-8 bg-white/80 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors" />
          </div>

          <div className="mt-8">
            <h2 className="text-black text-lg font-bold mb-4">메뉴</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/calendar')}
                className="flex flex-col items-center justify-center p-4 bg-white/80 hover:bg-white text-gray-800 rounded-2xl shadow-sm transition-all aspect-square group cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7 mb-2 text-gray-800 group-hover:scale-105 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs font-semibold">캘린더</span>
              </button>

              <button
                onClick={() => router.push('/settings')}
                className="flex flex-col items-center justify-center p-4 bg-white/80 hover:bg-white text-gray-800 rounded-2xl shadow-sm transition-all aspect-square group cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7 mb-2 text-gray-800 group-hover:scale-105 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-xs font-semibold">설정</span>
              </button>

              <button
                onClick={() => console.log('알림 클릭')}
                className="flex flex-col items-center justify-center p-4 bg-white/80 hover:bg-white text-gray-800 rounded-2xl shadow-sm transition-all aspect-square group cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7 mb-2 text-gray-800 group-hover:scale-105 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="text-xs font-semibold">알림</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}