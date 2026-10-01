"use client";

import ky, { isHTTPError } from "ky";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BadRequest from "./BadRequest";

const backendHost =
    process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8080";

export default function PasswordResetRequestForm() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState("");
    const [companyEmail, setCompanyEmail] = useState("");
    const [companycode, setCompanyCode] = useState("");
    const [wrongCredentials, setWrongCredentials] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleCancel = () => {
        router.push("/");
    };

    const handleConfirm = () => {
        console.log(
            "회사일련번호: ",
            companycode,
            "사원번호: ",
            employeeId,
            "사내 이메일: ",
            companyEmail,
        );
    };

    return (
        <div className="w-full max-w-xl rounded-3xl bg-main p-8 shadow-xl backdrop-blur-sm md:p-12">
            <h1 className="mb-6 text-3xl font-bold tracking-wide text-white md:text-4xl">
                비밀번호 재설정
            </h1>

            {wrongCredentials && <BadRequest />}

            <form
                className="space-y-5 flex flex-col"
                onSubmit={async (e) => {
                    e.preventDefault();

                    setIsPending(true);

                    const requestBody = {
                        companyId: companycode,
                        employeeId,
                        email: companyEmail,
                    };

                    try {
                        const resetRequest = await ky.post(
                            "/api/v1/password/request",
                            {
                                baseUrl: backendHost,
                                json: requestBody,
                            },
                        );

                        if (resetRequest.ok) {
                            router.push("/reset-request/success");
                        }
                    } catch (e) {
                        if (isHTTPError(e) && e.response.status === 400) {
                            console.warn(e);
                            setWrongCredentials(true);
                        } else {
                            throw e;
                        }
                        setIsPending(false);
                    }
                }}
            >
                <div>
                    <label
                        className="mb-1.5 block text-sm text-white/90 md:text-base"
                        htmlFor="companyId"
                    >
                        회사일련번호
                    </label>
                    <input
                        required
                        name="companyId"
                        id="companyId"
                        type="text"
                        value={companycode}
                        onChange={(e) => setCompanyCode(e.target.value)}
                        placeholder="회사일련번호"
                        className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                    />
                </div>

                <div>
                    <label
                        className="mb-1.5 block text-sm text-white/90 md:text-base"
                        htmlFor="employeeId"
                    >
                        사원번호
                    </label>
                    <input
                        required
                        type="text"
                        id="employeeId"
                        name="employeeId"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="사원번호"
                        className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                    />
                </div>

                <div>
                    <label
                        className="mb-1.5 block text-sm text-white/90 md:text-base"
                        htmlFor="email"
                    >
                        사내 이메일
                    </label>
                    <input
                        required
                        name="email"
                        id="email"
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="사내 이메일"
                        className="w-full rounded-lg border border-white/50 bg-indigo-300/30 px-4 py-2.5 text-white placeholder-white/60 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-white p-5 rounded-lg hover:cursor-pointer disabled:bg-gray-300 disabled:hover:cursor-not-allowed"
                    disabled={isPending}
                >
                    {isPending ? "전송 중..." : "재설정"}
                </button>
            </form>
        </div>
    );
}
