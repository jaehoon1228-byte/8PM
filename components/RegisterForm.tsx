"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, IdCard, Lock, Mail, User, UserPlus } from "lucide-react";
import SignUpSuccess from "./SignUpSuccess";

export default function RegisterForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        employeeId: "",
        password: "",
        confirmPassword: "",
        name: "",
        companyEmail: "",
        companyCode: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyCode.trim()) {
            alert("회사일련번호를 입력하세요.");
            return;
        }
        if (!formData.employeeId.trim()) {
            alert("사원번호를 입력하세요.");
            return;
        }
        if (!formData.password.trim()) {
            alert("비밀번호를 입력하세요.");
            return;
        }
        if (!formData.confirmPassword.trim()) {
            alert("비밀번호 재입력을 입력하세요.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
        if (!formData.name.trim()) {
            alert("이름을 입력하세요.");
            return;
        }
        if (!formData.companyEmail.trim()) {
            alert("이메일을 입력하세요.");
            return;
        }

        console.log("회원가입 정보: ", formData);

        setIsSubmitted(true);
    };

    const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        router.push("/");
    };

    if (isSubmitted) {
        return <SignUpSuccess />;
    }

    const inputClass =
        "w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-500/15 text-sm font-medium transition-all";

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50/50 to-slate-200 dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16] p-4 transition-colors">
            <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 p-8 sm:p-10 shadow-2xl shadow-slate-900/10 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl">
                <div className="flex flex-col items-center text-center mb-7">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-3">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                        MES Employee Registration
                    </span>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                        회원가입
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                            회사일련번호
                        </label>
                        <div className="relative flex items-center">
                            <Building2 className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                            <input
                                type="text"
                                name="companyCode"
                                placeholder="예: 10"
                                value={formData.companyCode}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                            사원번호
                        </label>
                        <div className="relative flex items-center">
                            <IdCard className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                            <input
                                type="text"
                                name="employeeId"
                                placeholder="사원번호 입력"
                                value={formData.employeeId}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                            비밀번호 입력
                        </label>
                        <div className="relative flex items-center">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                            <input
                                type="password"
                                name="password"
                                placeholder="비밀번호 입력"
                                value={formData.password}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                            비밀번호 재입력
                        </label>
                        <div className="relative flex items-center">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="비밀번호 다시 입력"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                            이름
                        </label>
                        <div className="relative flex items-center">
                            <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                            <input
                                type="text"
                                name="name"
                                placeholder="성명 입력"
                                value={formData.name}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                            사내 이메일
                        </label>
                        <div className="relative flex items-center">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                            <input
                                type="email"
                                name="companyEmail"
                                placeholder="name@mes-factory.com"
                                value={formData.companyEmail}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 font-semibold text-sm text-slate-700 dark:text-slate-200 transition cursor-pointer"
                        >
                            취소
                        </button>

                        <button
                            type="submit"
                            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 py-3 font-semibold text-sm text-white shadow-lg shadow-indigo-500/25 transition cursor-pointer"
                        >
                            확인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
