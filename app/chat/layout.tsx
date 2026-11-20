import { notFound, redirect } from "next/navigation";
import DashboardForm from "@/components/DashboardForm";
import { getDashboardInitialData } from "@/utils/serverApi";

/**
 * `/chat/*` 하위 채팅방 경로들이 공유하는 대시보드 레이아웃입니다 (Server Component).
 * 미인증/로그아웃 상태에서 채팅방 URL로 직접 접근 시 로그인 리다이렉트 대신 404를 반환합니다.
 * 인증된 사용자가 채팅방 간 이동(`/chat/[a]` → `/chat/[b]`)할 때는
 * 사이드바·프로필·파일 패널을 언마운트하지 않고 유지하며, 가운데 `{children}` 슬롯만 교체합니다.
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
    if (result.status === "ok" && !result.data.chatSessions) {
        notFound();
    }
    return (
        <main className="w-full h-screen">
            <DashboardForm initialData={result.data}>{children}</DashboardForm>
        </main>
    );
}
