import React from "react";

// 비밀번호 재설정 페이지의 공통 레이아웃 정의.
export default function PasswordResetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-gradient-start to-gradient-end">
            {children}
        </main>
    );
}
