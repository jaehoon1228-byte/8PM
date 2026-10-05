import PasswordResetForm from "@/components/PasswordResetForm";
import PasswordResetRequestForm from "@/components/PasswordResetRequestForm";
import { baseUrl } from "@/utils/api";
import ky, { isHTTPError } from "ky";
import { notFound } from "next/navigation";

export default async function ResetPassword({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const token = (await searchParams).token;

    // 토큰 값이 없는 경우 비밀번호 재설정 메일 페이지 반환
    if (!token || Array.isArray(token)) {
        return <PasswordResetRequestForm />;
    }

    // 토큰 유효성 검증 후, 유효하지 않으면 404
    try {
        const tokenCheck = await ky.get(`/api/v1/password/token/${token}`, {
            baseUrl,
        });

        if (!tokenCheck.ok) {
            notFound();
        }
    } catch (e) {
        if (isHTTPError(e) && e.response.status === 404) {
            notFound();
        } else {
            throw e;
        }
    }

    // 유효하면 재설정 페이지 반환
    return <PasswordResetForm token={token} />;
}
