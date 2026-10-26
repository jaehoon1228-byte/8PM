import LoginForm from "@/components/LoginForm";

export default async function Home() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-100 via-indigo-50/50 to-slate-200 dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16] p-4 transition-colors">
            <LoginForm />
        </main>
    );
}
