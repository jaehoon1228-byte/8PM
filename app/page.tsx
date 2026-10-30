import { redirect } from "next/navigation";
import DashboardForm from "@/components/DashboardForm";
import { getDashboardInitialData } from "@/utils/serverApi";

// [렌더링 전략] SSR (Server Component, 요청마다 동적 렌더링)
//  - HttpOnly 쿠키(refreshToken)를 서버에서 읽어 사용자 정보/채팅 목록/파일 목록을 병렬 조회
//  - 세션이 만료된 사용자는 화면을 그리기 전에 서버에서 로그인 화면으로 리다이렉트
//  - 조회된 데이터는 DashboardForm(Client Component)의 초기값으로 전달되어 첫 HTML 에 포함됨
export default async function DashboardPage() {
    const result = await getDashboardInitialData();

    if (result.status === "expired") {
        redirect("/login");
    }

    return (
        <main className="w-full h-screen">
            <DashboardForm initialData={result.data} />
        </main>
    );
}
