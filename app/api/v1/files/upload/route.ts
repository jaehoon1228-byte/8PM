import { NextResponse } from "next/server";

// [Mock API] POST /api/v1/files/upload
// 백엔드 FileUploadResponseDto 규격
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        const originName = file ? file.name : "업로드문서.pdf";
        const fileType = originName.split(".").pop() || "pdf";
        const fileId = "mock-file-" + Date.now();

        console.log("[Mock API] 파일 업로드 완료:", originName, `(${fileId})`);

        return NextResponse.json({
            message: "파일이 성공적으로 업로드되었습니다. (Mock)",
            fileData: {
                fileId,
                originName,
                fileType,
                uploadedAt: new Date().toISOString(),
            },
            parsedData: [],
        });
    } catch {
        return NextResponse.json({ message: "파일 업로드 실패 (Mock)" }, { status: 400 });
    }
}
