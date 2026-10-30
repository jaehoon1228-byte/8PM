"use server";

import { cookies } from "next/headers";

export async function setRefreshToken(token: string) {
    const cookieStore = await cookies();

    // 로컬 환경(localhost)과 배포 도메인 구분
    const isProduction = process.env.NODE_ENV === "production";
    const domain =
        isProduction && process.env.COOKIE_DOMAIN
            ? process.env.COOKIE_DOMAIN
            : undefined;

    cookieStore.set("refreshToken", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 86400,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/",
        ...(domain ? { domain } : {}),
    });
}

export async function getRefreshToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get("refreshToken")?.value;
}

export async function clearRefreshToken(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("refreshToken");
}
