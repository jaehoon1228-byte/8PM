import { redirect } from "next/navigation";
import SettingsPageClient from "@/components/dashboard/SettingsPageClient";
import { toUserInfo } from "@/utils/endpoints";
import { getDashboardInitialData } from "@/utils/serverApi";

/**
 * 설정 페이지 라우트 컴포넌트입니다 (Server Component).
 * 세션을 검증해 비로그인/만료 사용자는 `/login`으로 리다이렉트하고,
 * 인증된 사용자 정보를 클라이언트 설정 래퍼로 전달합니다.
 */
export default async function SettingsPage() {
    const result = await getDashboardInitialData();

    if (result.status === "expired" || !result.data.userInfo) {
        redirect("/login");
    }

    return <SettingsPageClient userInfo={toUserInfo(result.data.userInfo)} />;
}
