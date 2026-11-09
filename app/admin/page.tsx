import { notFound, redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getAdminInitialData } from "@/utils/serverApi";
import { isManagerOrAbove } from "@/utils/role";

// [렌더링 전략] SSR + CSR 하이브리드
//  1) SSR (Server Component): HttpOnly 쿠키(refreshToken)를 서버에서 읽어
//     관리자 정보(/users/me), 소속 회사 사원 목록(/users), 사내 파일 목록(/files)을 병렬 조회
//  2) 서버 단 사전 보안 차단: 비로그인(/login 리다이렉트) 및 일반 사원 ROLE_USER(/ 리다이렉트) 즉시 차단
//  3) 조회된 초기 데이터(initialData)를 AdminDashboard(Client Component)로 전달하여 첫 HTML 렌더링 즉시 완성
/**
 * 관리자 페이지 라우트 컴포넌트입니다 (Server Component).
 * 세션을 검증해 비로그인 사용자는 /login 으로, 중간관리자 미만 권한은 404 로 보내며,
 * 통과하면 서버에서 조회한 초기 데이터로 AdminDashboard 를 렌더링합니다.
 * @returns 관리자 대시보드 JSX (리다이렉트 또는 notFound 시 렌더링되지 않음)
 */
export default async function AdminPage() {
    const result = await getAdminInitialData();

    // 1. 미로그인 또는 세션 만료 시 로그인 페이지로 리다이렉트
    if (result.status === "expired" || !result.data.userInfo) {
        redirect("/login");
    }

    const { userInfo } = result.data;

    // 2. 중간관리자(ROLE_MANAGER) 이상이 아니면 메인 대시보드로 리다이렉트
    if (!isManagerOrAbove(userInfo.role)) {
        // redirect("/");
        notFound();
    }

    return <AdminDashboard userInfo={userInfo} initialData={result.data} />;
}
