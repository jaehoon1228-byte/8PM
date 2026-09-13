'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// 방금 만든 utils 폴더의 api 모듈을 불러옵니다.
import { api } from '../utils/api';

interface UserInfo {
    companyId: number;
    employeeId: number;
    username: string;
    email: string;
    role: string;
}

export default function UserProfile() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchMyInfo = async () => {
            try {
                // 인터셉터가 알아서 토큰을 넣고 갱신해주므로 단 한 줄이면 끝납니다!
                const response = await api.get('/api/v1/users/me');
                setUserInfo(response.data);
            } catch (error) {
                console.error("통신 에러가 발생했습니다.", error);
            }
        };

        fetchMyInfo();
    }, []);

   const handleLogout = async () => {
    try {
        // 1. 백엔드로 로그아웃 요청 전송 (Redis 토큰 삭제 및 HttpOnly 쿠키 무효화 트리거)
        // 주의: 백엔드 시큐리티 설정에 따라 경로가 다를 수 있습니다. (예: /logout 또는 /api/v1/logout)
        await api.post('/api/v1/logout'); 
    } catch (error) {
        console.error("백엔드 로그아웃 처리 실패:", error);
    } finally {
        // 2. 백엔드 처리 성공 여부와 상관없이 프론트엔드 스토리지 비우기 및 이동
        localStorage.removeItem('accessToken');
        alert("로그아웃 되었습니다.");
        router.push('/');
    }
};

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-lg flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            >
                {userInfo ? userInfo.username.charAt(0) : '?'}
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-20 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">
                            {userInfo ? `${userInfo.username} 님` : '로딩 중...'}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                            {userInfo ? userInfo.email : ''}
                        </p>
                    </div>
                    <div className="py-1">
                        <button
                            onClick={() => {
                                setIsModalOpen(true);
                                setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                            👤 내 정보 조회
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            🚪 로그아웃
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && userInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden transform transition-all">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">내 프로필</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-white hover:text-gray-200 text-xl font-bold"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <div className="text-xl font-bold text-gray-900">{userInfo.username}</div>
                                <p className="text-gray-500 mt-1 text-sm">회사코드: {userInfo.companyId} | 사번: {userInfo.employeeId}</p>
                            </div>
                            <div className="bg-blue-50 px-3 py-1.5 rounded-md inline-block">
                                <span className="text-sm font-semibold text-blue-700">{userInfo.role}</span>
                            </div>
                            <p className="text-sm text-gray-600">{userInfo.email}</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}