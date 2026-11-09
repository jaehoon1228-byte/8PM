// =====================================================================
// 로컬 개발 및 테스트용 인메모리 Mock 데이터베이스
//  - 백엔드(MES-AI-ChatBot-Web-BackEnd) 엔티티(UserMember, FileMetadata) 구조와 1:1 대응
//  - globalThis 에 상태를 유지하여 Next.js HMR 리로드 시에도 데이터가 보존됨
// =====================================================================
import type { UserInfo, UserRole } from "@/types/dashboard";

/**
 * 백엔드 UserMember 엔티티에 대응하는 Mock 사용자 레코드입니다.
 * `UserInfo` 필드에 로그인 검증용 비밀번호와 권한(role)을 더한 형태입니다.
 */
export interface MockUserRecord extends UserInfo {
    /** 로그인 검증용 평문 비밀번호 (Mock 전용, 선택) */
    password?: string;
    /** 사용자 권한 (ROLE_MASTER, ROLE_MANAGER, ROLE_USER 등) */
    role: UserRole;
}

/**
 * 백엔드 FileMetadata 엔티티에 대응하는 Mock 파일 메타데이터 레코드입니다.
 */
export interface MockFileRecord {
    /** 파일 고유 ID */
    fileId: string;
    /** 소속 회사 ID */
    companyId: number;
    /** 업로드한 사원 ID */
    employeeId: number;
    /** 원본 파일명 */
    originName: string;
    /** 파일 확장자 또는 형식 (pdf, docx, xlsx, csv 등) */
    fileType: string;
    /** 회사 공용 파일 여부 (true 면 공용, false 면 개인 파일) */
    shared: boolean;
    /** 업로드 일시 (타임존 없는 PlainDateTime) */
    uploadedAt: Temporal.PlainDateTime;
    /** 파일 크기 표시 문자열 (예: "2.4MB") */
    size: string;
    /** 파싱된 파일 본문 텍스트 (RAG 답변 근거로 사용) */
    parsedContent: string;
}

/**
 * Mock DB 전체 구조입니다. 사용자 목록과 파일 목록을 보관합니다.
 */
interface MockDatabase {
    /** 사용자 레코드 목록 */
    users: MockUserRecord[];
    /** 파일 메타데이터 레코드 목록 */
    files: MockFileRecord[];
}

/** Mock DB 인스턴스를 globalThis에 보관하기 위한 전역 선언입니다. */
declare global {
    /** 인메모리 Mock DB 인스턴스 (초기화 전에는 undefined) */
    var __mesMockDb: MockDatabase | undefined;
}

/**
 * 시드 데이터로 채워진 초기 Mock DB를 생성합니다.
 * 회사 3곳(10, 20, 30)의 관리자/일반 사원 계정과 공용/개인 파일 샘플을 포함합니다.
 * @returns 초기 상태의 Mock DB 객체
 */
function createInitialMockDatabase(): MockDatabase {
    return {
        users: [
            {
                companyId: 10,
                companyName: "한국제조 스마트팩토리",
                employeeId: 20260000,
                username: "최고관리자",
                email: "master.admin@mes-platform.com",
                role: "ROLE_MASTER",
                password: "Password1!",
                createdAt: Temporal.PlainDateTime.from("2026-01-01T09:00:00"),
            },
            {
                companyId: 10,
                companyName: "한국제조 스마트팩토리",
                employeeId: 20260041,
                username: "홍길동",
                email: "gildong.hong@mes-factory.com",
                role: "ROLE_MANAGER",
                password: "Password1!",
                createdAt: Temporal.PlainDateTime.from("2026-06-09T09:00:00"),
            },
            {
                companyId: 10,
                companyName: "한국제조 스마트팩토리",
                employeeId: 20260101,
                username: "김철수",
                email: "chulsoo.kim@mes-factory.com",
                role: "ROLE_USER",
                password: "Password1!",
                createdAt: Temporal.PlainDateTime.from("2026-07-12T10:30:00"),
            },
            {
                companyId: 10,
                companyName: "한국제조 스마트팩토리",
                employeeId: 20260102,
                username: "이영희",
                email: "younghee.lee@mes-factory.com",
                role: "ROLE_USER",
                password: "Password1!",
                createdAt: Temporal.PlainDateTime.from("2026-08-03T14:15:00"),
            },
            {
                companyId: 10,
                companyName: "한국제조 스마트팩토리",
                employeeId: 20260103,
                username: "박민수",
                email: "minsoo.park@mes-factory.com",
                role: "ROLE_USER",
                password: "Password1!",
                createdAt: Temporal.PlainDateTime.from("2026-09-20T11:00:00"),
            },
            {
                companyId: 20,
                companyName: "대한정밀 엔지니어링",
                employeeId: 20260201,
                username: "정수빈",
                email: "subin.jung@daehan-eng.com",
                role: "ROLE_MANAGER",
                password: "Password1!",
                createdAt: Temporal.PlainDateTime.from("2026-05-10T09:00:00"),
            },
            {
                companyId: 20,
                companyName: "대한정밀 엔지니어링",
                employeeId: 20260202,
                username: "최동훈",
                email: "donghoon.choi@daehan-eng.com",
                role: "ROLE_USER",
                password: "Password1!",
                createdAt: Temporal.PlainDateTime.from("2026-06-18T11:20:00"),
            },
            {
                companyId: 30,
                companyName: "미래반도체 솔루션",
                employeeId: 20260301,
                username: "한지민",
                email: "jimin.han@mirae-semi.com",
                role: "ROLE_MANAGER",
                password: "Password1!",
                createdAt: Temporal.PlainDateTime.from("2026-04-15T09:30:00"),
            },
            {
                companyId: 30,
                companyName: "미래반도체 솔루션",
                employeeId: 20260302,
                username: "강태호",
                email: "taeho.kang@mirae-semi.com",
                role: "ROLE_USER",
                password: "Password1!",
                createdAt: Temporal.PlainDateTime.from("2026-07-22T15:10:00"),
            },
        ],
        files: [
            {
                fileId: "shared-file-1001",
                companyId: 10,
                employeeId: 20260041,
                originName: "2026_전사_표준공정_가이드라인.pdf",
                fileType: "pdf",
                shared: true,
                uploadedAt: Temporal.PlainDateTime.from("2026-10-01T09:00:00"),
                size: "2.4MB",
                parsedContent:
                    "전사 표준 공정 가이드라인: A라인 표준 온도는 185℃, B라인 표준 압력은 4.2bar이며 일일 정기 점검은 08:30에 실시합니다.",
            },
            {
                fileId: "shared-file-1002",
                companyId: 10,
                employeeId: 20260041,
                originName: "스마트팩토리_안전수칙_공용매뉴얼.docx",
                fileType: "docx",
                shared: true,
                uploadedAt: Temporal.PlainDateTime.from("2026-10-15T13:20:00"),
                size: "1.8MB",
                parsedContent:
                    "전사 안전수칙 공용매뉴얼: 작업장 출입 시 안전모와 보호안경을 필수 착용하며 비상정지 스위치는 각 공정 제어반 우측에 위치합니다.",
            },
            {
                fileId: "shared-file-2001",
                companyId: 20,
                employeeId: 20260201,
                originName: "대한정밀_CNC가공_표준작업서.pdf",
                fileType: "pdf",
                shared: true,
                uploadedAt: Temporal.PlainDateTime.from("2026-10-12T10:00:00"),
                size: "3.1MB",
                parsedContent:
                    "대한정밀 CNC 가공 표준작업서: 스핀들 회전수 4500RPM 기준, 절삭유 농도 6~8% 유지 필수.",
            },
            {
                fileId: "shared-file-3001",
                companyId: 30,
                employeeId: 20260301,
                originName: "미래반도체_클린룸_방진관리규정.xlsx",
                fileType: "xlsx",
                shared: true,
                uploadedAt: Temporal.PlainDateTime.from("2026-10-20T09:30:00"),
                size: "1.6MB",
                parsedContent:
                    "미래반도체 클린룸 방진관리규정: Class 100 구역 온도 22±0.5℃, 습도 45±3% 유지.",
            },
            {
                fileId: "user-file-20260101-1",
                companyId: 10,
                employeeId: 20260101,
                originName: "김철수_1라인_일일점검표.xlsx",
                fileType: "xlsx",
                shared: false,
                uploadedAt: Temporal.PlainDateTime.from("2026-11-01T10:15:00"),
                size: "0.8MB",
                parsedContent:
                    "1라인 일일점검표(김철수): 사출기 1호기 금형 온도 정상, 냉각수 유량 분당 18L 정상.",
            },
            {
                fileId: "user-file-20260101-2",
                companyId: 10,
                employeeId: 20260101,
                originName: "1라인_불량률_분석보고서.pdf",
                fileType: "pdf",
                shared: false,
                uploadedAt: Temporal.PlainDateTime.from("2026-11-03T16:40:00"),
                size: "1.5MB",
                parsedContent:
                    "1라인 불량률 분석보고서(김철수): 10월 불량률 0.42%로 전월 대비 0.15%p 감소.",
            },
            {
                fileId: "user-file-20260102-1",
                companyId: 10,
                employeeId: 20260102,
                originName: "이영희_품질검사_체크리스트.csv",
                fileType: "csv",
                shared: false,
                uploadedAt: Temporal.PlainDateTime.from("2026-11-04T11:20:00"),
                size: "0.4MB",
                parsedContent:
                    "품질검사 체크리스트(이영희): 외관 치수 오차 ±0.02mm 이내 합격 판정.",
            },
            {
                fileId: "user-file-20260103-1",
                companyId: 10,
                employeeId: 20260103,
                originName: "박민수_설비보전_작업이력서.docx",
                fileType: "docx",
                shared: false,
                uploadedAt: Temporal.PlainDateTime.from("2026-11-05T14:50:00"),
                size: "1.1MB",
                parsedContent:
                    "설비보전 작업이력서(박민수): 컨베이어 벨트 장력 조정 및 베어링 윤활유 보충 완료.",
            },
            {
                fileId: "user-file-20260202-1",
                companyId: 20,
                employeeId: 20260202,
                originName: "최동훈_선반공정_측정기록부.xlsx",
                fileType: "xlsx",
                shared: false,
                uploadedAt: Temporal.PlainDateTime.from("2026-11-02T13:10:00"),
                size: "0.9MB",
                parsedContent:
                    "선반공정 측정기록부(최동훈): 내경 공차 0.005mm 이내 전수 합격.",
            },
            {
                fileId: "user-file-20260302-1",
                companyId: 30,
                employeeId: 20260302,
                originName: "강태호_웨이퍼식각_로그데이터.csv",
                fileType: "csv",
                shared: false,
                uploadedAt: Temporal.PlainDateTime.from("2026-11-06T16:00:00"),
                size: "1.3MB",
                parsedContent:
                    "웨이퍼식각 로그데이터(강태호): 플라즈마 챔버 진공도 15mTorr 안정 유지.",
            },
        ],
    };
}

/**
 * 전역 인메모리 Mock DB 인스턴스를 반환합니다.
 * globalThis에 없으면 초기 시드로 생성하고, 이미 있으면 시드 중 누락된 사용자/파일만 추가합니다.
 * (HMR 로 데이터가 사라지지 않도록 유지하면서 새 시드 데이터는 반영하기 위함)
 * @returns 전역 Mock DB 인스턴스
 */
export function getMockDb(): MockDatabase {
    if (!globalThis.__mesMockDb) {
        globalThis.__mesMockDb = createInitialMockDatabase();
    } else {
        const seed = createInitialMockDatabase();
        for (const u of seed.users) {
            if (
                !globalThis.__mesMockDb.users.some(
                    (existing) =>
                        existing.companyId === u.companyId &&
                        existing.employeeId === u.employeeId,
                )
            ) {
                globalThis.__mesMockDb.users.push(u);
            }
        }
        for (const f of seed.files) {
            if (
                !globalThis.__mesMockDb.files.some(
                    (existing) => existing.fileId === f.fileId,
                )
            ) {
                globalThis.__mesMockDb.files.push(f);
            }
        }
    }
    return globalThis.__mesMockDb;
}

/**
 * 요청 헤더(Authorization 또는 Cookie)에서 현재 로그인한 사용자 정보를 추출합니다.
 * 토큰 형식 `mock-(access|refresh)-{companyId}_{employeeId}-`에서 식별자를 읽어 사용자를 찾고,
 * 식별할 수 없으면 관리자(ROLE_MANAGER)를 기본 사용자로 반환합니다.
 * @param request 현재 HTTP 요청 (없으면 기본 사용자를 반환)
 * @returns 식별된 사용자 레코드, 식별할 수 없으면 기본 사용자
 */
export function resolveMockUserFromRequest(request?: Request): MockUserRecord {
    const db = getMockDb();
    const fallback =
        db.users.find((u) => u.role === "ROLE_MANAGER") ?? db.users[0];

    if (!request) return fallback;

    const authHeader = request.headers.get("authorization") ?? "";
    const cookieHeader = request.headers.get("cookie") ?? "";
    const combined = `${authHeader} ${cookieHeader}`;

    const match = combined.match(/mock-(?:access|refresh)-(\d+)_(\d+)-/);
    if (match) {
        const companyId = Number(match[1]);
        const employeeId = Number(match[2]);
        const found = db.users.find(
            (u) => u.companyId === companyId && u.employeeId === employeeId,
        );
        if (found) return found;
    }

    return fallback;
}
