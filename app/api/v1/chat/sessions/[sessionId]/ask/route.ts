import { NextResponse } from "next/server";
import { getMockDb, resolveMockUserFromRequest } from "@/utils/mockStore";
import { nowMs } from "@/utils/time";

// [Mock API] POST /api/v1/chat/sessions/[sessionId]/ask
// 백엔드 LlmChatService.askToLlm() 및 FileMetadataRepository.findAccessibleFiles() 규격 반영:
//  - 같은 회사(companyId)의 모든 공용 데이터 파일(shared = true)을 자동으로 파싱해 읽음
//  - 질문한 사용자 본인이 업로드한 개별 파일(shared = false, employeeId 일치)도 함께 참조
export async function POST(
    request: Request,
    context: { params: Promise<{ sessionId: string }> },
) {
    const currentUser = resolveMockUserFromRequest(request);
    const db = getMockDb();
    const { sessionId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
        message?: string;
    };
    const userMsg = body.message || "질문 내용 없음";

    // 같은 회사의 공용 데이터 파일(shared = true) + 본인의 개별 파일(shared = false) 조회
    const sharedCompanyFiles = db.files.filter(
        (f) => f.companyId === currentUser.companyId && f.shared,
    );
    const personalFiles = db.files.filter(
        (f) =>
            f.companyId === currentUser.companyId &&
            !f.shared &&
            f.employeeId === currentUser.employeeId,
    );

    await new Promise((r) => setTimeout(r, 600));

    const sharedContextSummary =
        sharedCompanyFiles.length > 0
            ? sharedCompanyFiles
                  .map((f) => `• [전사 공용] ${f.originName}: ${f.parsedContent}`)
                  .join("\n")
            : "• 등록된 전사 공용 데이터 파일 없음";

    const personalContextSummary =
        personalFiles.length > 0
            ? personalFiles
                  .map((f) => `• [개인 문서] ${f.originName}: ${f.parsedContent}`)
                  .join("\n")
            : "• 등록된 개인 업로드 문서 없음";

    const mockAiAnswer =
        `[MES AI RAG 분석 답변]\n` +
        `"${userMsg}" 질문에 대해 사내 공용 데이터(${sharedCompanyFiles.length}건) 및 개인 문서(${personalFiles.length}건)를 자동 파싱하여 분석한 결과입니다.\n\n` +
        `[참조된 전사 공용 데이터]\n${sharedContextSummary}\n\n` +
        `[참조된 개인 문서 데이터]\n${personalContextSummary}\n\n` +
        `해당 정보는 정확하지 않을 수 있으며, 사측에서는 해당 답변으로 인해 발생하는 모든 피해에 대해 어떠한 책임도 지지 않습니다.`;

    return NextResponse.json({
        chatId: "mock-chat-" + nowMs(),
        companyId: currentUser.companyId,
        employeeId: currentUser.employeeId,
        sessionId,
        message: mockAiAnswer,
        recordedAt: Temporal.Now.plainDateTimeISO(),
        role: "assistant",
    });
}
