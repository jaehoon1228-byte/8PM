"use client";

import { useRouter } from "next/navigation";

interface SignUpSuccessProps{
    onConfirm?: () => void
}

export default function SignUpSuccess({onConfirm}: SignUpSuccessProps){
    const router = useRouter();

    const handleConfirm = () => {
        if(onConfirm){
            onConfirm();
        }
        router.push('/')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#8c92e9] p-4">
            <div className="relative flex min-h-[500px] w-full max-w-lg flex-col justify-between rounded-3xl bg-indigo-400/70 p-12 text-white shadow-2xl backdrop-blur-md sm:p-16">
                <h1 className="text-3xl font-bold tracking-wide">
                    회원가입
                </h1>
                <div className="space-y-2 text-2xl font-bold leading-snug">
                    <p>
                        회원가입이 완료되었습니다!
                    </p>
                    <p>
                        로그인 화면으로 가서 로그인 하세요.
                    </p>
                </div>
                <div className="flex justify-center">
                    <button onClick={handleConfirm}
                    className="w-32 rounded-lg border border-white/80 bg-transparent py-2.5 font-semibold text-white transition hover:bg-white/10 active:scale-95">
                        확인
                    </button>
                </div>
            </div>
        </div>
    )
}