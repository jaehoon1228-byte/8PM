import { notFound } from "next/navigation";
import ChatRoomClient from "@/components/dashboard/ChatRoomClient";
import { getChatRoomHistories } from "@/utils/serverApi";

interface ChatRoomPageProps {
    params: Promise<{ chatId: string }>;
}

/**
 * `/chat/[chatId]` 동적 라우트 페이지입니다 (Server Component).
 * URL PathVariable의 `chatId`에 해당하는 대화 내역만 서버에서 단독 조회하며,
 * 미인증 상태이거나 유효하지 않은 UUID·존재하지 않는·권한 없는 채팅방이면 404를 반환합니다.
 */
export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
    const { chatId } = await params;
    const result = await getChatRoomHistories(chatId);

    if (result.status !== "ok") {
        notFound();
    }

    return (
        <ChatRoomClient
            key={chatId}
            chatId={chatId}
            initialMessages={result.messages}
        />
    );
}
