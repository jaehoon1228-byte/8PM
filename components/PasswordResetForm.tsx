'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PasswordResetForm() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companycode, setCompanyCode] = useState('');

    const handleCancel = () => {
        router.push('/');
    }

    const handleConfirm = () => {
        console.log('회사일련번호: ', companycode, '사원번호: ', employeeId, '사내 이메일: ', companyEmail);
    }

    return (
        <div className="w-full max-w-xl bg-[#8d95f7] rounded-3xl p-12 sm:p-16 shadow-2xl">
            <div className="w-full max-w-xl rounded-3xl bg-[#8c98f0]/80 p-8 shadow-xl backdrop-blur-sm md:p-12">
                <h1 className="mb-6 text-3xl font-bold tracking-wide text-white md:text-4xl">
                    비밀번호 설정
                </h1>

                <div className="space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm text-white/90 md:text-base">
                            회사일련번호를 입력하세요.
                        </label>
                        <input 
                            type="text" 
                            value={companycode}
                            onChange={(e) => setCompanyCode(e.target.value)}
                            placeholder="회사일련번호"
                            className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"   
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm text-white/90 md:text-base">
                            사원번호를 입력하세요.
                        </label>
                        <input 
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            placeholder="사원번호"
                            className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm text-white/90 md:text-base">
                            사내 이메일을 입력하세요.
                        </label>
                        <input 
                            type="email"
                            value={companyEmail}
                            onChange={(e) => setCompanyEmail(e.target.value)}
                            placeholder="사내 이메일"
                            className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}