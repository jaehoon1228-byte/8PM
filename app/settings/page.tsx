"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SettingsModal from "@/components/dashboard/SettingsModal";
import { fetchMyInfo } from "@/utils/dashboardApi";
import type { UserInfo } from "@/types/dashboard";

export default function SettingsPage() {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState<UserInfo | undefined>(undefined);

    useEffect(() => {
        fetchMyInfo()
            .then(setUserInfo)
            .catch(() => {
                // 비로그인 시 무시
            });
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/50 to-slate-200 dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16]">
            <SettingsModal
                isOpen
                onClose={() => router.push("/dashboard")}
                userInfo={userInfo}
            />
        </div>
    );
}
