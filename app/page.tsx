import { redirect } from "next/navigation";
import DashboardForm from "@/components/DashboardForm";
import ChatRoomClient from "@/components/dashboard/ChatRoomClient";
import { getDashboardInitialData } from "@/utils/serverApi";

// [렌더링 전략] SSR (Server Component, 요청마다 동적 렌더링)
//  - 메인(`/`)은 새 채팅 대기 화면이므로 대화 내역 API를 호출하지 않습니다.
//  - 개별 채팅방 대화 내역은 `/chat/[chatId]` 경로에서 해당 chatId에 대해서만 단독 조회합니다.
export default async function DashboardPage() {
    const result = await getDashboardInitialData();

    if (result.status === "expired" || !result.data.userInfo) {
        redirect("/login");
    }

    return (
        <main className="w-full h-screen">
            <DashboardForm initialData={result.data}>
                <ChatRoomClient />
            </DashboardForm>
        </main>
    );
}
