import { NextResponse } from "next/server";

// [Mock API] DELETE /api/v1/files/delete/[fileId]
// 백엔드 FileDeleteResponseDto 규격
export async function DELETE(
    _request: Request,
    context: { params: Promise<{ fileId: string }> },
) {
    const { fileId } = await context.params;
    console.log("[Mock API] 파일 삭제:", fileId);

    return NextResponse.json({
        fileId,
        message: "파일 메타데이터가 성공적으로 삭제되었습니다. (Mock)",
        deletedAt: new Date().toISOString(),
    });
}
