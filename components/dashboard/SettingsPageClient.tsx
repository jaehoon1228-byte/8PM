"use client";

import { useRouter } from "next/navigation";
import SettingsModal from "@/components/dashboard/SettingsModal";
import type { UserInfo } from "@/types/dashboard";

interface SettingsPageClientProps {
    userInfo: UserInfo;
}

/**
 * `/settings` 라우트에서 서버로부터 전달받은 사용자 정보로 설정 모달을 렌더링하는 클라이언트 래퍼입니다.
 */
export default function SettingsPageClient({
    userInfo,
}: SettingsPageClientProps) {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-100 via-indigo-50/50 to-slate-200 dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16]">
            <SettingsModal
                isOpen
                onClose={() => router.push("/")}
                userInfo={userInfo}
            />
        </div>
    );
}
