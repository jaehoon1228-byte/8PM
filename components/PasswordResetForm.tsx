"use client";

import { baseUrl } from "@/utils/api";
import ky, { isHTTPError } from "ky";
import Form from "next/form";
import { useState } from "react";
import BadRequest from "./BadRequest";
import { useRouter } from "next/navigation";
import { KeyRound, LockKeyhole } from "lucide-react";

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
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-900/95 sm:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                    <KeyRound className="h-6 w-6" />
                </div>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    비밀번호 재설정
                </h1>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    비밀번호를 재설정하세요.
                </p>
            </div>

            {/* badRequest 상태에 따라 오류 메시지 표시 */}
            {badRequest === "missing" ? (
                <BadRequest message="비밀번호를 입력하세요." />
            ) : badRequest === "notMatch" ? (
                <BadRequest message="두 비밀번호가 일치하지 않습니다." />
            ) : undefined}

            {/* 비밀번호 재설정 폼 */}
            <Form
                className="space-y-4"
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
                <div className="flex flex-col gap-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 ml-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                            새 비밀번호
                        </label>
                        <div className="relative flex items-center">
                            <LockKeyhole className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
                            <input
                                required
                                type="password"
                                name="password"
                                id="password"
                                placeholder="새 비밀번호 입력"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="passwordRepeat"
                            className="mb-1.5 ml-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                            새 비밀번호 확인
                        </label>
                        <div className="relative flex items-center">
                            <LockKeyhole className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
                            <input
                                required
                                type="password"
                                name="passwordRepeat"
                                id="passwordRepeat"
                                placeholder="비밀번호를 다시 입력하세요"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99]"
                    >
                        변경
                    </button>
                </div>
            </Form>
        </div>
    );
}
