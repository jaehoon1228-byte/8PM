import { NextResponse } from "next/server";

// [Mock API] GET /api/v1/chat/sessions/[sessionId]/histories
// 백엔드 List<ChatHistory> 규격
export async function GET(
    _request: Request,
    context: { params: Promise<{ sessionId: string }> },
) {
    const { sessionId } = await context.params;
    console.log(`[Mock API] 과거 대화 내역 조회 (${sessionId})`);

    return NextResponse.json([
        {
            chatId: "hist-1-" + sessionId,
            message: "MES 공정 1라인의 어제 불량률을 알려줘.",
            recordedAt: new Date(Date.now() - 3600000).toISOString(),
            role: "user",
        },
        {
            chatId: "hist-2-" + sessionId,
            message:
                "1공정 라인의 어제 불량률은 0.18%로 목표치(0.5%) 이내로 양호하게 관리되었습니다.\n\n해당 정보는 정확하지 않을 수 있으며, 사측에서는 해당 답변으로 인해 발생하는 모든 피해에 대해 어떠한 책임도 지지 않습니다.",
            recordedAt: new Date(Date.now() - 3590000).toISOString(),
            role: "assistant",
        },
    ]);
}
