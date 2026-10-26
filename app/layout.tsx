import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "MES AI ChatBot",
    description:
        "제조실행시스템(MES) 데이터 기반 엔터프라이즈 AI 챗봇 웹 플랫폼",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="ko"
            suppressHydrationWarning
            className={`font-sans h-full antialiased`}
        >
            <head>
                <link
                    rel="stylesheet"
                    as="style"
                    crossOrigin="anonymous"
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `try{if(localStorage.getItem("mes_pref_dark_mode")==="true"){document.documentElement.classList.add("dark")}}catch(e){}`,
                    }}
                />
            </head>
            <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100">
                {children}
            </body>
        </html>
    );
}
