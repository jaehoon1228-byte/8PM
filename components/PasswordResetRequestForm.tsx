"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, IdCard, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import Form from "next/form";
import { baseUrl } from "@/utils/api";
import ky, { isHTTPError } from "ky";

export default function PasswordResetForm() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState("");
    const [companyEmail, setCompanyEmail] = useState("");
    const [companycode, setCompanyCode] = useState("");
    const [isPending, setIsPending] = useState(false);

    const handleConfirm = async () => {
        setIsPending(true);
        if (!companycode.trim()) {
            alert("회사일련번호를 입력하세요.");
            return;
        }
        if (!employeeId.trim()) {
            alert("사원번호를 입력하세요.");
            return;
        }
        if (!companyEmail.trim()) {
            alert("사내 이메일을 입력하세요.");
            return;
        }
        console.log(
            "회사일련번호: ",
            companycode,
            "사원번호: ",
            employeeId,
            "사내 이메일: ",
            companyEmail,
        );

        const requestBody = {
            companyId: companycode,
            employeeId,
            email: companyEmail,
        };

        try {
            const resetRequest = await ky.post("/api/v1/password/request", {
                baseUrl,
                json: requestBody,
            });

            if (resetRequest.ok) {
                router.push("/reset-pw/success");
            }
        } catch (e) {
            if (isHTTPError(e) && e.response.status === 400) {
                console.warn(e);
                // setWrongCredentials(true);
                alert("정보가 잘못되었습니다.");
                return;
            } else {
                throw e;
            }
        } finally {
            setIsPending(false);
        }

        alert("비밀번호 재설정 안내 메일이 발송되었습니다.");
        router.push("/login");
    };

    return (
        <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-900/10 border border-slate-200/80 dark:border-slate-800 transition-colors">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
                    <KeyRound className="w-6 h-6" />
                </div>
                {/* <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    MES Account Recovery
                </span> */}
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                    비밀번호 재설정
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    등록된 정보를 입력하여 비밀번호를 재설정할 수 있습니다.
                </p>
            </div>

            <Form className="space-y-4" action={handleConfirm}>
                <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                        회사일련번호
                    </label>
                    <div className="relative flex items-center">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                        <input
                            required
                            type="text"
                            value={companycode}
                            onChange={(e) => setCompanyCode(e.target.value)}
                            placeholder="회사일련번호"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-500/15 text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                        사원번호
                    </label>
                    <div className="relative flex items-center">
                        <IdCard className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                        <input
                            required
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            placeholder="사원번호"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-500/15 text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                        사내 이메일
                    </label>
                    <div className="relative flex items-center">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                        <input
                            required
                            type="email"
                            value={companyEmail}
                            onChange={(e) => setCompanyEmail(e.target.value)}
                            placeholder="사내 이메일"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-indigo-500/15 text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Link
                        type="button"
                        href="/login"
                        className="text-center flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition cursor-pointer"
                    >
                        취소
                    </Link>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 py-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition cursor-pointer"
                    >
                        확인
                    </button>
                </div>
            </Form>
        </div>
    );
}
