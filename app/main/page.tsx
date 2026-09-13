'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// 올바른 상위 경로(../)를 통해 각각 불러옵니다.
import UserProfile from '../../components/UserProfile'; 
import { api } from '../../utils/api';

export default function MainPage() {
    const [status, setStatus] = useState("대기 중...");
    const [lastChecked, setLastChecked] = useState("없음");
    const router = useRouter();

    const handleTokenCheck = async () => {
        try {
            setStatus("통신 확인 중...");
            
            // 토큰 꺼내기, 넣기, 재발급을 인터셉터가 모두 처리하므로 통신 코드만 적습니다.
            await api.get('/api/v1/users/me'); 

            setStatus("✅ 통신 성공: Access Token이 정상 작동 중입니다!");
            setLastChecked(new Date().toLocaleTimeString());
            
        } catch (error) {
            setStatus("❌ 통신 실패: 세션이 완전히 만료되었습니다.");
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            router.push('/'); 
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-200 relative">
            
            <div className="absolute top-6 right-6 z-50">
                <UserProfile />
            </div>

            <div className="w-full max-w-2xl bg-white rounded-3xl p-10 shadow-xl mt-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                    대시보드 메인
                </h1>
                
                <div className="bg-blue-50 p-6 rounded-xl mb-8 border border-blue-100">
                    <h2 className="text-lg font-bold text-blue-800 mb-4">현재 토큰 통신 상태</h2>
                    <p className="text-gray-700 mb-2">상태: <span className="font-semibold text-indigo-600">{status}</span></p>
                    <p className="text-gray-700">마지막 확인 시간: <span className="font-semibold">{lastChecked}</span></p>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={handleTokenCheck}
                        className="flex-1 py-4 bg-[#8d95f7] text-white font-bold rounded-lg hover:bg-indigo-500 transition-all shadow-md">
                        API 통신 테스트 (Access Token 검증)
                    </button>
                </div>
            </div>
        </div>
    );
}