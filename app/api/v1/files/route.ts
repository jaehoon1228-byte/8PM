import { NextResponse } from "next/server";
import { getMockDb, resolveMockUserFromRequest } from "@/utils/mockStore";
import { formatFileSize } from "@/utils/endpoints";

// [Mock API] FileController: GET /api/v1/files & POST /api/v1/files?shared=true|false
// 백엔드 FileService.getFiles() / uploadFile() 로직과 1:1 대응

export async function GET(request: Request) {
    const currentUser = resolveMockUserFromRequest(request);
    const db = getMockDb();
    const { searchParams } = new URL(request.url);

    const sharedParam = searchParams.get("shared");
    const targetEmployeeParam = searchParams.get("employeeId");
    const allCompanyParam = searchParams.get("allCompany");
    const requestedCompanyParam = searchParams.get("companyId");

    // 최고관리자(ROLE_MASTER)가 특정 회사일련번호(companyId)를 선택한 경우 해당 회사 기준으로 필터링
    const targetCompanyId =
        currentUser.role === "ROLE_MASTER" && requestedCompanyParam
            ? Number(requestedCompanyParam)
            : currentUser.companyId;

    let filtered = db.files.filter((f) => f.companyId === targetCompanyId);

    if (allCompanyParam === "true" && currentUser.role !== "ROLE_USER") {
        // 관리자가 사내 전체 파일(공용 + 사원별 개별 파일)을 조회할 때
    } else if (sharedParam === "true") {
        // 공용 데이터 파일 목록 조회
        filtered = filtered.filter((f) => f.shared);
    } else if (targetEmployeeParam && currentUser.role !== "ROLE_USER") {
        // 관리자가 특정 사원의 개별 업로드 파일 목록 조회
        const targetEmpId = Number(targetEmployeeParam);
        filtered = filtered.filter(
            (f) => !f.shared && f.employeeId === targetEmpId,
        );
    } else {
        // 메인페이지 기본 조회: 현재 로그인한 사용자의 개별 파일만 반환 (중간관리자의 공용파일 제외!)
        filtered = filtered.filter(
            (f) => !f.shared && f.employeeId === currentUser.employeeId,
        );
    }

    return NextResponse.json(
        filtered.map((f) => ({
            fileId: f.fileId,
            companyId: f.companyId,
            employeeId: f.employeeId,
            originName: f.originName,
            fileType: f.fileType,
            shared: f.shared,
            uploadedAt: f.uploadedAt,
        })),
    );
}

export async function POST(request: Request) {
    try {
        const currentUser = resolveMockUserFromRequest(request);
        const db = getMockDb();
        const { searchParams } = new URL(request.url);

        const shared = searchParams.get("shared") === "true";
        if (shared && currentUser.role === "ROLE_USER") {
            return NextResponse.json(
                {
                    message: "일반 사원은 공용 데이터 파일을 업로드할 권한이 없습니다.",
                    fileData: null,
                    parsedData: null,
                },
                { status: 403 },
            );
        }

        const targetCompanyParam = searchParams.get("targetCompanyId");
        const ownerCompanyId =
            currentUser.role === "ROLE_MASTER" && targetCompanyParam
                ? Number(targetCompanyParam)
                : currentUser.companyId;

        const targetEmployeeParam = searchParams.get("targetEmployeeId");
        const ownerEmployeeId =
            !shared &&
            targetEmployeeParam &&
            currentUser.role !== "ROLE_USER"
                ? Number(targetEmployeeParam)
                : currentUser.employeeId;

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                {
                    message: "파일이 올바르지 않습니다.",
                    fileData: null,
                    parsedData: null,
                },
                { status: 400 },
            );
        }

        const originName = file.name || "업로드문서.pdf";
        const fileType = (originName.split(".").pop() || "pdf").toLowerCase();
        const allowedExtensions = ["pdf", "docx", "xlsx", "pptx", "csv"];
        if (!allowedExtensions.includes(fileType)) {
            return NextResponse.json(
                {
                    message: `지원하지 않는 파일 형식입니다: ${originName} (PDF, DOCX, XLSX, PPTX, CSV만 허용)`,
                    fileData: null,
                    parsedData: null,
                },
                { status: 400 },
            );
        }
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                {
                    message: "파일 크기는 10MB를 초과할 수 없습니다.",
                    fileData: null,
                    parsedData: null,
                },
                { status: 413 },
            );
        }

        const normalizedOriginName = originName.trim().toLowerCase();
        if (shared) {
            const isDuplicateShared = db.files.some(
                (f) =>
                    f.companyId === ownerCompanyId &&
                    f.shared &&
                    f.originName.trim().toLowerCase() === normalizedOriginName,
            );
            if (isDuplicateShared) {
                return NextResponse.json(
                    {
                        message: "이미 존재하는 파일입니다.",
                        fileData: null,
                        parsedData: null,
                    },
                    { status: 409 },
                );
            }
        } else {
            const isDuplicatePersonal = db.files.some(
                (f) =>
                    f.companyId === ownerCompanyId &&
                    !f.shared &&
                    f.employeeId === ownerEmployeeId &&
                    f.originName.trim().toLowerCase() === normalizedOriginName,
            );
            if (isDuplicatePersonal) {
                return NextResponse.json(
                    {
                        message: "이미 업로드한 파일이 존재합니다.",
                        fileData: null,
                        parsedData: null,
                    },
                    { status: 409 },
                );
            }
        }
        const fileId = `${shared ? "shared" : "user"}-file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const uploadedAt = new Date().toISOString();

        // 텍스트/CSV 계열 파일이면 실제 내용을 일부 읽어 RAG 파싱 데이터로 보관
        let extractedText = "";
        try {
            if (
                fileType === "csv" ||
                fileType === "txt" ||
                fileType === "md" ||
                fileType === "json"
            ) {
                const rawText = await file.text();
                extractedText = rawText.replace(/\s+/g, " ").slice(0, 300);
            }
        } catch {
            // 바이너리 파일 무시
        }

        const parsedContent =
            extractedText ||
            `${shared ? "[전사 공용 문서]" : "[개인 업로드 문서]"} ${originName} (${fileType.toUpperCase()}) 파싱 완료 데이터`;

        const record = {
            fileId,
            companyId: ownerCompanyId,
            employeeId: ownerEmployeeId,
            originName,
            fileType,
            shared,
            uploadedAt,
            size: formatFileSize(file.size),
            parsedContent,
        };

        db.files.unshift(record);

        return NextResponse.json({
            message: "파일이 성공적으로 업로드되었습니다.",
            fileData: {
                fileId: record.fileId,
                companyId: record.companyId,
                employeeId: record.employeeId,
                originName: record.originName,
                fileType: record.fileType,
                shared: record.shared,
                uploadedAt: record.uploadedAt,
            },
            parsedData: [
                {
                    companyId: record.companyId,
                    fileId: record.fileId,
                    rowNumber: 1,
                    rowData: parsedContent,
                },
            ],
        });
    } catch {
        return NextResponse.json(
            {
                message: "파일이 올바르지 않습니다.",
                fileData: null,
                parsedData: null,
            },
            { status: 400 },
        );
    }
}
