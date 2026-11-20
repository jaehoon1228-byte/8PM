import ChatRoomClient from "@/components/dashboard/ChatRoomClient";

/**
 * `/chat` 새 채팅 대기 화면입니다 (Server Component).
 * 인증 검사와 대시보드 셸(사이드바·프로필·파일 패널)은 `app/chat/layout.tsx`가 담당하며,
 * 개별 채팅방 대화 내역은 `/chat/[chatId]`에서 해당 chatId에 대해서만 단독 조회합니다.
 */
export default function NewChatPage() {
    return <ChatRoomClient />;
}
