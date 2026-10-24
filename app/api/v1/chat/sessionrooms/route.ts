import { NextResponse } from "next/server";

// [Mock API] POST /api/v1/chat/sessionrooms
// 백엔드 ChatSessionResponseDto 규격
export async function POST(request: Request) {
    const body = (await request.json().catch(() => ({}))) as { title?: string };
    const sessionId = "mock-session-" + Date.now();
    const title = body.title || "새 대화 세션";

    console.log("[Mock API] 새 세션 생성:", { sessionId, title });

    return NextResponse.json({
        sessionId,
        companyId: 10,
        employeeId: 20260041,
        sessionTitle: title,
        createdAt: new Date().toISOString(),
    });
}
