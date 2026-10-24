// [렌더링 전략] SSR 스트리밍 Fallback
//  - page.tsx 가 서버에서 백엔드 응답을 기다리는 동안 즉시 보여줄 골격 화면
export default function DashboardLoading() {
    return (
        <main className="w-full h-screen">
            <div className="flex h-screen w-full bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16] p-5 gap-5 relative overflow-hidden font-sans box-border">
                <aside className="w-72 bg-white/80 dark:bg-slate-900/80 rounded-3xl p-5 shadow-lg border border-slate-200/80 dark:border-slate-800 shrink-0 animate-pulse" />
                <section className="flex-1 bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium animate-pulse">
                        MES 워크스페이스를 불러오는 중...
                    </p>
                </section>
                <div className="w-72 flex flex-col gap-5 shrink-0">
                    <aside className="h-22 bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800 animate-pulse" />
                    <aside className="flex-1 bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800 animate-pulse" />
                </div>
            </div>
        </main>
    );
}
