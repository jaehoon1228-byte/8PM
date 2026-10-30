import { NextResponse } from "next/server";

// [Mock API] DELETE /api/v1/chat/sessions/[sessionId]
export async function DELETE(
    _request: Request,
    context: { params: Promise<{ sessionId: string }> },
) {
    const { sessionId } = await context.params;
    console.log(`[Mock API] 대화방 삭제 완료 (${sessionId})`);
    // 실제 백엔드(ChatController)와 동일하게 200 + 문자열 본문 반환
    return new NextResponse("삭제되었습니다.", { status: 200 });
}
