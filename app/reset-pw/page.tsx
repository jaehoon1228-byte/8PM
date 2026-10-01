import BadToken from "@/components/BadToken";
import { handleSubmit } from "@/utils/resetPassword";
import Form from "next/form";

export default async function ResetPassword({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const token = (await searchParams).token;

    return (
        <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-gradient-start to-gradient-end">
            <div className="w-full max-w-xl bg-main rounded-3xl p-12 sm:p-16 shadow-2xl">
                <h1 className="text-3xl font-bold text-center text-white mb-10">
                    비밀번호 재설정
                </h1>

                {!token || Array.isArray(token) ? (
                    <BadToken />
                ) : (
                    <Form
                        className="space-y-6"
                        action={async (formData) => {
                            "use server";
                            await handleSubmit(formData, token);
                        }}
                    >
                        <div className="flex flex-col gap-12">
                            <div className="flex flex-col gap-5">
                                <input
                                    required
                                    type="password"
                                    name="password"
                                    id="password"
                                    placeholder="비밀번호"
                                    className="w-full px-6 py-4 bg-transparent border border-white/70 rounded-lg text-white placeholder-white/80 focus:outline-none focus:border-white text-sm"
                                />
                                <input
                                    required
                                    type="password"
                                    name="passwordRepeat"
                                    id="passwordRepeat"
                                    placeholder="비밀번호 재입력"
                                    className="w-full px-6 py-4 bg-transparent border border-white/70 rounded-lg text-white placeholder-white/80 focus:outline-none focus:border-white text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-white text-[#8d95f7] font-bold rounded-lg hover:bg-opacity-90 transition-all text-sm cursor-pointer"
                            >
                                변경
                            </button>
                        </div>
                    </Form>
                )}
            </div>
        </main>
    );
}
