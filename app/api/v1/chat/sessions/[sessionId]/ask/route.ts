import { NextResponse } from "next/server";

// [Mock API] POST /api/v1/chat/sessions/[sessionId]/ask
// 백엔드 AskResponseDto 규격
export async function POST(
    request: Request,
    context: { params: Promise<{ sessionId: string }> },
) {
    const { sessionId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { message?: string };
    const userMsg = body.message || "질문 내용 없음";

    console.log(`[Mock API] 질문 수신 (${sessionId}):`, userMsg);

    // AI 답변 모의 지연 (0.7초)
    await new Promise((r) => setTimeout(r, 700));

    const mockAiAnswer = `[MES AI Mock 답변]\n"${userMsg}"에 대해 조회된 최신 공정 데이터입니다.\n현재 A라인의 가동률은 94.2%이며 정상 가동 중입니다.\n\n해당 정보는 정확하지 않을 수 있으며, 사측에서는 해당 답변으로 인해 발생하는 모든 피해에 대해 어떠한 책임도 지지 않습니다.`;

    return NextResponse.json({
        chatId: "mock-chat-" + Date.now(),
        companyId: 10,
        employeeId: 20260041,
        sessionId,
        message: mockAiAnswer,
        recordedAt: new Date().toISOString(),
        role: "assistant",
    });
}
