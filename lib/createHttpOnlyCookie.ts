"use server";

import { cookies } from "next/headers";

export async function setRefreshToken(token:string) {
    const cookieStore = await cookies();

    cookieStore.set("refreshToken", token, {httpOnly: true});
}