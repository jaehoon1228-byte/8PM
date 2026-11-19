import { redirect } from "next/navigation";
import DashboardForm from "@/components/DashboardForm";
import { getDashboardInitialData } from "@/utils/serverApi";

/**
 * `/chat/*` 하위 채팅방 경로들이 공유하는 대시보드 레이아웃입니다 (Server Component).
 * 채팅방 간 이동(`/chat/[a]` → `/chat/[b]`) 시 사이드바·프로필·파일 패널을 언마운트하지 않고 유지하며,
 * 가운데 `{children}` 슬롯만 새 `chatId` 데이터로 교체합니다.
 */
export default async function ChatLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const result = await getDashboardInitialData();

    if (result.status === "expired" || !result.data.userInfo) {
        redirect("/login");
    }

    return (
        <main className="w-full h-screen">
            <DashboardForm initialData={result.data}>{children}</DashboardForm>
        </main>
    );
}
