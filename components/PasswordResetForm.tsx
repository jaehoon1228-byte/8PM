"use client";

import { baseUrl } from "@/utils/api";
import ky, { isHTTPError } from "ky";
import Form from "next/form";
import { useState } from "react";
import BadRequest from "./BadRequest";
import { useRouter } from "next/navigation";

type PasswordResetRequestData = {
    password: string;
    passwordRepeat: string;
};
type BadRequestType = "missing" | "notMatch" | undefined;

/**
 * 비밀번호 재설정을 처리하는 함수.
 * @param formData Next.js Form에서 자동 주입됨.
 * @param token 재설정 페이지 토큰.
 * @param handleBadRequest 요청 오류 시 수행할 동작.
 */
async function handleSubmit(
    formData: FormData,
    token: string,
    handleBadRequest: (status: BadRequestType) => void,
): Promise<{ ok: boolean; message: string }> {
    // FormData에서 필드 추출.
    const data: PasswordResetRequestData = {
        password: formData.get("password")?.toString() ?? "",
        passwordRepeat: formData.get("passwordRepeat")?.toString() ?? "",
    };

    // 비밀번호가 제공되지 않으면 오류 표시
    if (!data.password || !data.passwordRepeat) {
        handleBadRequest("missing");
    }
    // 두 비밀번호가 일치하지 않으면 오류 표시
    if (data.password !== data.passwordRepeat) {
        handleBadRequest("notMatch");
    }

    // 요청 바디 조립
    const requestBody = { token, newPassword: data.password };

    // 백엔드에 비밀번호 재설정 요청
    try {
        const request = await ky.post("/api/v1/password/update", {
            baseUrl,
            json: requestBody,
        });

        // 성공 시 응답 메시지와 함께 true 반환
        if (request.ok) {
            return { ok: request.ok, message: await request.text() };
        }
    } catch (e) {
        // 400 시 오류 처리
        if (isHTTPError(e) && e.response.status === 400) {
            return { ok: false, message: await e.response.text() };
        }
    }

    // 그 외 알 수 없는 오류 처리
    return { ok: false, message: "Unknown error" };
}

export default function PasswordResetForm({ token }: { token: string }) {
    /**
     * Next.js 클라이언트 라우터
     */
    const router = useRouter();
    /**
     * 요청 오류 상태를 담는 State
     */
    const [badRequest, setBadRequest] = useState<BadRequestType>(undefined);

    // 오류 표시 처리 함수
    const handleBadRequest = (status: BadRequestType) => {
        setBadRequest(status as BadRequestType);
    };

    return (
        <div className="w-full max-w-xl bg-main rounded-3xl p-12 sm:p-16 shadow-2xl">
            <h1 className="text-3xl font-bold text-center text-white mb-10">
                비밀번호 재설정
            </h1>

            {/* badRequest 상태에 따라 오류 메시지 표시 */}
            {badRequest === "missing" ? (
                <BadRequest message="비밀번호를 입력하세요." />
            ) : badRequest === "notMatch" ? (
                <BadRequest message="두 비밀번호가 일치하지 않습니다." />
            ) : undefined}

            {/* 비밀번호 재설정 폼 */}
            <Form
                className="space-y-6"
                action={async (formData) => {
                    // 요청 전송
                    const result = await handleSubmit(
                        formData,
                        token,
                        handleBadRequest,
                    );

                    // 성공 시 페이지 이동
                    if (result.ok) {
                        router.push("/reset-pw/success?type=reset-success");
                    } else {
                        handleBadRequest("missing");
                    }
                }}
            >
                <div className="flex flex-col gap-12">
                    <div className="flex flex-col gap-5">
                        <input
                            required
                            type="password"
                            name="password"
                            id="password"
                            placeholder="비밀번호"
                            className="w-full px-6 py-4 bg-transparent border border-white/70 rounded-lg text-white placeholder-white/80 focus:outline-none focus:border-white text-sm"
                        />
                        <input
                            required
                            type="password"
                            name="passwordRepeat"
                            id="passwordRepeat"
                            placeholder="비밀번호 재입력"
                            className="w-full px-6 py-4 bg-transparent border border-white/70 rounded-lg text-white placeholder-white/80 focus:outline-none focus:border-white text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-4 bg-white text-main font-bold rounded-lg hover:bg-opacity-90 transition-all text-sm cursor-pointer"
                    >
                        변경
                    </button>
                </div>
            </Form>
        </div>
    );
}
