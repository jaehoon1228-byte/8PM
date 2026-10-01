"use server";

import { cookies } from "next/headers";

export async function setRefreshToken(token: string) {
    const cookieStore = await cookies();

    cookieStore.set("refreshToken", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 86400,
        sameSite: "none",
        secure: true,
        path: "/",
        domain: "mes.thepji.kro.kr",
    });
}
