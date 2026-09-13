'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../utils/api";

export default function LoginForm() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [companycode, setCompanycode] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if(!companycode.trim()) {
            alert('회사일련번호를 입력하세요.');
            return;
        }
        if(!employeeId.trim()) {
            alert('사원번호를 입력하세요.');
            return;
        }
        if(!password.trim()) {
            alert('비밀번호를 입력하세요.');
            return;
        }

        try {
            // 백엔드가 요구하는 필드명(companyId, employeeId, password)에 맞춘 JSON 전송
            const response = await api.post('/api/v1/login', {
                companyId: companycode,
                employeeId: employeeId,
                password: password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const authHeader = response.headers['authorization'] || response.headers['Authorization'];
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const accessToken = authHeader.replace('Bearer ', '');
                localStorage.setItem('accessToken', accessToken); 
                
                router.push('/main'); 
            } else {
                alert('로그인은 성공했으나 토큰을 받지 못했습니다.');
            }

        } catch (error: any) {
            console.error('로그인 에러 상세:', error);
            if (error.response) {
                alert(`로그인 실패: ${error.response.data.message || '아이디와 비밀번호를 확인해주세요.'}`);
            } else {
                alert('서버와 통신할 수 없습니다.');
            }
        }
    };

    return (
        <div className="w-full max-w-xl bg-[#8d95f7] rounded-3xl p-12 sm:p-16 shadow-2xl">
            <h1 className="text-3xl font-bold text-center text-white mb-10">
                로그인
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <input type="text" 
                    placeholder="회사일련번호"
                    value={companycode}
                    onChange={(e) => setCompanycode(e.target.value)}
                    className="w-full px-6 py-4 bg-transparent border border-white/70 rounded-lg text-white placeholder-white/80 focus:outline-none focus:border-white text-sm"/>
                </div>

                <div>
                    <input type="text"
                     placeholder="사원 번호"
                     value={employeeId}
                     onChange={(e) => setEmployeeId(e.target.value)}
                     className="w-full px-6 py-4 bg-transparent border border-white/70 rounded-lg text-white placeholder-white/80 focus:outline-none focus:border-white text-sm"/>
                </div>

                <div>
                    <input type="password"
                     placeholder="비밀번호"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)} 
                     className="w-full px-6 py-4 bg-transparent border border-white/70 rounded-lg text-white placeholder-white/80 focus:outline-none focus:border-white text-sm"/>
                </div>
                
                <button type="submit"
                    className="w-full py-4 bg-white text-[#8d95f7] font-bold rounded-lg hover:bg-opacity-90 transition-all text-sm">
                    로그인
                </button>
            </form>

            <div className="flex justify-between items-center mt-10 text-sm text-white/90 px-1">
                <button type="button" onClick={() => router.push('/register')} className="hover:underline focus:outline-none cursor-pointer">
                    회원가입
                </button>
                
                <button type="button" onClick={() => console.log('비밀번호 찾기 클릭')} className="hover:underline focus:outline-none cursor-pointer">
                    비밀번호 찾기
                </button>
            </div>
        </div>
    );
}