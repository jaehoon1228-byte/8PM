"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Building2, IdCard, Lock } from "lucide-react";
import ky from "ky";
import { setRefreshToken } from "@/utils/createHttpOnlyCookie";
import { recordLoginTimestamp } from "@/utils/preferences";

export default function LoginForm() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [companycode, setCompanycode] = useState<string>("");
    const [loginFailed, setLoginFailed] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        type LoginResponse = {
            message: string;
            refreshToken: string;
        };

        if (!companycode.trim()) {
            alert("회사일련번호를 입력하세요.");
            return;
        }
        if (!employeeId.trim()) {
            alert("사원번호를 입력하세요.");
            return;
        }
        if (!password.trim()) {
            alert("비밀번호를 입력하세요.");
            return;
        }

        const loginCredentials = {
            companyId: companycode,
            employeeId,
            password,
        };

        const loginRequest = await ky.post(
            `${process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8080"}/api/v1/login`,
            { body: JSON.stringify(loginCredentials), throwHttpErrors: false },
        );

        if (loginRequest.ok) {
            setLoginFailed(false);
            const loginResponse = await loginRequest.json<LoginResponse>();
            await setRefreshToken(loginResponse.refreshToken);
            recordLoginTimestamp();
            router.push("/dashboard");
        } else if (loginRequest.status === 401) {
            setLoginFailed(true);
        }
    };

    return (
        <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-900/10 border border-slate-200/80 dark:border-slate-800 transition-colors">
            <div className="flex flex-col items-center text-center mb-8">
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    MES AI ChatBot Web
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                    스마트팩토리 로그인
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    회사 일련번호와 사원 계정으로 워크스페이스에 접속하세요.
                </p>
            </div>

            {loginFailed && <SignInFailed />}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">
                        회사일련번호
                    </label>
                    <div className="relative flex items-center">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="예: 10"
                            value={companycode}
                            onChange={(e) => setCompanycode(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-500/15 text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">
                        사원번호
                    </label>
                    <div className="relative flex items-center">
                        <IdCard className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="사원 번호 입력"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-500/15 text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">
                        비밀번호
                    </label>
                    <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                        <input
                            type="password"
                            placeholder="비밀번호 입력"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-500/15 text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full mt-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                    <span>로그인</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </form>

            <div className="flex justify-between items-center mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none cursor-pointer"
                >
                    회원가입
                </button>

                <button
                    type="button"
                    onClick={() => router.push("/reset-password")}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none cursor-pointer"
                >
                    비밀번호 설정
                </button>
            </div>
        </div>
    );
}

function SignInFailed() {
    return (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-500/20 flex items-center justify-center gap-2 mb-5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>입력한 정보가 일치하지 않습니다.</span>
        </div>
    );
}
