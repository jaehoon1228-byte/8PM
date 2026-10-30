import Link from "next/link";

export default async function ResetPasswordRequestSuccess({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // 주소 창에서 type 검색 파라미터를 가져옴
    const params = (await searchParams).type;

    // 참고: 해당 코드는 페이지만 반환하지, 실제 동작은 수행하지 않음.
    // ?type=reset-success 시 비밀번호 재설정 완료로 간주, 이에 맞는 페이지 반환
    if (params && !Array.isArray(params) && params === "reset-success") {
        return (
            <>
                <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-slate-200/80 bg-white/95 p-8 text-center text-slate-900 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-900/95 dark:text-white sm:p-10">
                    <h1 className="text-2xl font-extrabold tracking-tight">
                        비밀번호 재설정
                    </h1>
                    <div className="space-y-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        <p>비밀번호 재설정이 완료되었습니다!</p>
                        <p>이제 변경한 비밀번호로 로그인할 수 있습니다.</p>
                    </div>
                    <Link
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-[0.99]"
                        href="/login"
                    >
                        로그인 페이지로 이동
                    </Link>
                </div>
            </>
        );
    }

    // 그 외의 경우 요청 완료 페이지 반환
    return (
        <>
            <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-8 text-slate-900 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-900/95 dark:text-white sm:p-10">
                <h1 className="mb-6 text-2xl font-extrabold tracking-tight">
                    비밀번호 재설정
                </h1>
                <div className="space-y-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <p>재설정 안내 메일이 발송되었습니다.</p>
                    <p>비밀번호 재설정을 계속하려면 메일함을 확인하세요.</p>
                </div>
            </div>
        </>
    );
}
