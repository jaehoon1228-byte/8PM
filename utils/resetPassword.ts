"use server";

import ky from "ky";
import { redirect } from "next/navigation";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:3000";

type PasswordResetRequestData = {
    password: string;
    passwordRepeat: string;
};

export async function handleSubmit(formData: FormData, token: string) {
    const data: PasswordResetRequestData = {
        password: formData.get("password")?.toString() ?? "",
        passwordRepeat: formData.get("passwordRepeat")?.toString() ?? "",
    };

    if (!data.password || !data.passwordRepeat) {
        redirect(`/reset-pw?token=${token}&badRequest=missing`);
    }
    if (data.password !== data.passwordRepeat) {
        redirect(`/reset-pw?token=${token}&badRequest=notMatch`);
    }

    const requestBody = { token, newPassword: data.password };

    try {
        const request = await ky.post("/api/v1/", {
            baseUrl,
            json: requestBody,
        });
    } catch (e) {}
}
