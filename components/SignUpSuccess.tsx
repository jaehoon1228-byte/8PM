"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

interface SignUpSuccessProps {
    onConfirm?: () => void;
}

export default function SignUpSuccess({ onConfirm }: SignUpSuccessProps) {
    const router = useRouter();

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        router.push("/login");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-100 via-indigo-50/50 to-slate-200 dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16] p-4 transition-colors">
            <div className="relative flex w-full max-w-md flex-col items-center text-center rounded-3xl bg-white/95 dark:bg-slate-900/95 p-10 text-slate-900 dark:text-white shadow-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-9 h-9" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                    회원가입 완료
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                    사원 계정 등록이 성공적으로 완료되었습니다.
                    <br />
                    로그인 화면으로 이동하여 워크스페이스에 접속하세요.
                </p>
                <button
                    onClick={handleConfirm}
                    className="w-full rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 py-3.5 font-semibold text-sm text-white shadow-lg shadow-indigo-500/25 transition cursor-pointer"
                >
                    로그인 화면으로 이동
                </button>
            </div>
        </div>
    );
}
