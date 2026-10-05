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
                <div className="flex flex-col justify-center items-center gap-6 text-center w-full max-w-xl rounded-3xl bg-main p-8 shadow-xl backdrop-blur-sm md:p-12">
                    <h1 className=" text-3xl font-bold tracking-wide text-white md:text-4xl">
                        비밀번호 재설정
                    </h1>
                    <div className="text-white">
                        <p>비밀번호 재설정이 완료되었습니다!</p>
                        <p>이제 변경한 비밀번호로 로그인할 수 있습니다.</p>
                    </div>
                    <Link className="p-3 px-10 bg-white rounded-xl" href="/">
                        로그인 페이지로 이동
                    </Link>
                </div>
            </>
        );
    }

    // 그 외의 경우 요청 완료 페이지 반환
    return (
        <>
            <div className="w-full max-w-xl rounded-3xl bg-main p-8 shadow-xl backdrop-blur-sm md:p-12">
                <h1 className="mb-6 text-3xl font-bold tracking-wide text-white md:text-4xl">
                    비밀번호 재설정
                </h1>
                <div className="text-white">
                    <p>재설정 안내 메일이 발송되었습니다.</p>
                    <p>비밀번호 재설정을 계속하려면 메일함을 확인하세요.</p>
                </div>
            </div>
        </>
    );
}
