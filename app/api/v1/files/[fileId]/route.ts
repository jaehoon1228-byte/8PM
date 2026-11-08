import { NextResponse } from "next/server";
import { getMockDb, resolveMockUserFromRequest } from "@/utils/mockStore";

// [Mock API] FileController: DELETE /api/v1/files/[fileId]
// 백엔드 FileService.delete() 권한 검증 및 삭제 로직과 1:1 대응

export async function DELETE(
    request: Request,
    context: { params: Promise<{ fileId: string }> },
) {
    const currentUser = resolveMockUserFromRequest(request);
    const { fileId } = await context.params;
    const db = getMockDb();

    const index = db.files.findIndex((f) => f.fileId === fileId);
    if (index === -1) {
        return NextResponse.json(
            {
                fileId: null,
                message: "존재하지 않는 파일 ID입니다.",
                deletedAt: null,
            },
            { status: 404 },
        );
    }

    const targetFile = db.files[index];

    if (
        currentUser.role !== "ROLE_MASTER" &&
        targetFile.companyId !== currentUser.companyId
    ) {
        return NextResponse.json(
            {
                fileId: null,
                message: "타 회사의 파일은 삭제할 수 없습니다.",
                deletedAt: null,
            },
            { status: 403 },
        );
    }

    if (currentUser.role === "ROLE_USER") {
        if (
            targetFile.employeeId !== currentUser.employeeId ||
            targetFile.shared
        ) {
            return NextResponse.json(
                {
                    fileId: null,
                    message: "일반 사원은 본인이 업로드한 파일만 삭제할 수 있습니다.",
                    deletedAt: null,
                },
                { status: 403 },
            );
        }
    }

    db.files.splice(index, 1);

    return NextResponse.json({
        fileId,
        message: "파일이 성공적으로 삭제되었습니다.",
        deletedAt: Temporal.Now.plainDateTimeISO(),
    });
}
