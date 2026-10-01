export default function ResetPasswordRequestSuccess() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-gradient-start to-gradient-end p-4">
            <div className="w-full max-w-xl rounded-3xl bg-main p-8 shadow-xl backdrop-blur-sm md:p-12">
                <h1 className="mb-6 text-3xl font-bold tracking-wide text-white md:text-4xl">
                    비밀번호 재설정
                </h1>
                <div className="text-white">
                    <p>재설정 안내 메일이 발송되었습니다.</p>
                    <p>비밀번호 재설정을 계속하려면 메일함을 확인하세요.</p>
                </div>
            </div>
        </main>
    );
}
