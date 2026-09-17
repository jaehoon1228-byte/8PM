'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import SignUpSuccess from "./SignUpSuccess";

export default function RegisterForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        employeeId: '',
        password: '',
        confirmPassword: '',
        name: '',
        companyEmail: '',
        companyCode: ''
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
            alert('회사일련번호를 입력하세요.');
            return;
        }
        if (!formData.employeeId.trim()) {
            alert('사원번호를 입력하세요.');
            return;
        }
        if (!formData.password.trim()) {
            alert('비밀번호를 입력하세요.');
            return;
        }
        if (!formData.confirmPassword.trim()) {
            alert('비밀번호 재입력을 입력하세요.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (!formData.name.trim()) {
            alert('이름을 입력하세요.');
            return;
        }
        if (!formData.companyEmail.trim()) {
            alert('이메일을 입력하세요.');
            return;
        }

        console.log('회원가입 정보: ', formData);

        setIsSubmitted(true);
    };

    const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        router.push('/');
    };

    if (isSubmitted) {
        return <SignUpSuccess />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#8c92e9] p-4">
            <div className="w-full max-w-lg rounded-2xl bg-indigo-400/70 p-8 shadow-xl backdrop-blur-md">
                <h1 className="mb-6 text-3xl font-bold text-white">
                    회원가입
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/90">
                            회사일련번호
                        </label>
                        <input 
                            type="text"
                            name="companyCode"
                            value={formData.companyCode}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/90">
                            사원번호
                        </label>
                        <input 
                            type="text"
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/90">
                            비밀번호 입력
                        </label>
                        <input 
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/90">
                            비밀번호 재입력
                        </label>
                        <input 
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/90">
                            이름
                        </label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/90">
                            사내 이메일
                        </label>
                        <input 
                            type="email" 
                            name="companyEmail"
                            value={formData.companyEmail}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                        />
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={handleCancel}
                            className="w-32 rounded-lg border border-white/80 bg-transparent py-2.5 font-semibold text-white transition hover:bg-white/10 active:scale-95"
                        >
                            취소
                        </button>

                        <button 
                            type="submit" 
                            className="w-32 rounded-lg border border-white/80 bg-transparent py-2.5 font-semibold text-white transition hover:bg-white/10 active:scale-95"
                        >
                            확인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}