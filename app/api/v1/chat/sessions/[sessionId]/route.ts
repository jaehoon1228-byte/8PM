import { NextResponse } from "next/server";

// [Mock API] DELETE /api/v1/chat/sessions/[sessionId]
export async function DELETE(
    _request: Request,
    context: { params: Promise<{ sessionId: string }> },
) {
    const { sessionId } = await context.params;
    console.log(`[Mock API] 대화방 삭제 완료 (${sessionId})`);
    return NextResponse.json({
        sessionId,
        message: "대화방이 성공적으로 삭제되었습니다. (Mock)",
    });
}
