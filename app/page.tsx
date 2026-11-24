import { redirect } from "next/navigation";
import { getDashboardInitialData } from "@/utils/serverApi";
import { getHomePath } from "@/utils/role";

// [렌더링 전략] SSR (Server Component, 요청마다 동적 렌더링)
//  - 메인(`/`)은 화면을 렌더링하지 않고 인증 상태와 사용자 역할에 따라 진입 경로로 보냅니다.
//  - 미인증은 `/login`, 인증된 사용자는 역할별 홈(기본 `/chat`)으로 이동합니다.
export default async function HomePage() {
    const result = await getDashboardInitialData();

    if (result.status !== "ok" || !result.data.userInfo) {
        redirect("/login");
    }
    redirect(getHomePath(result.data.userInfo.role));
}
