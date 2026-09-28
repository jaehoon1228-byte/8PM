'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, User, Bell, Moon, Lock, Info, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="w-full h-full min-h-screen bg-[#818cf8] p-6 text-slate-800 flex flex-col justify-between">
      
      {/* 상단 헤더 및 중앙 설정 영역 */}
      <div className="w-full max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 bg-white/30 rounded-full hover:bg-white/50 transition cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">설정</h1>
          <div className="w-10"></div> {/* 대칭 유지를 위한 빈 공간 */}
        </div>

        {/* 설정 메뉴 카드 그룹 (가로 폭 축소 적용) */}
        <div className="space-y-4">
          
          {/* 계정 정보 그룹 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 mb-3 px-1">계정 정보</h2>
            <div className="space-y-2">
              <button 
                type="button"
                className="w-full flex items-center justify-between p-2.5 hover:bg-indigo-50 rounded-xl transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 text-gray-700">
                  <User className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-medium">내 정보 관리</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button 
                type="button"
                className="w-full flex items-center justify-between p-2.5 hover:bg-indigo-50 rounded-xl transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 text-gray-700">
                  <Lock className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-medium">비밀번호 및 보안</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* 앱 설정 그룹 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 mb-3 px-1">앱 설정</h2>
            <div className="space-y-2">
              
              {/* 푸시 알림 토글 */}
              <div className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-3 text-gray-700">
                  <Bell className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-medium">푸시 알림</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    notifications ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                      notifications ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 다크 모드 토글 */}
              <div className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-3 text-gray-700">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-medium">다크 모드</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    darkMode ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                      darkMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* 기타 정보 그룹 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 mb-3 px-1">기타</h2>
            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-3 text-gray-700">
                <Info className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium">앱 버전 정보</span>
              </div>
              <span className="text-xs text-gray-400 font-semibold">v1.0.0</span>
            </div>
          </div>

        </div>
      </div>

      {/* 하단 로그아웃 버튼 (가로 폭 중앙 정렬 적용) */}
      <div className="w-full max-w-xl mx-auto mt-6">
        <button 
          type="button"
          onClick={() => router.push('/login')}
          className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 border border-white/20 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
      </div>

    </div>
  );
}