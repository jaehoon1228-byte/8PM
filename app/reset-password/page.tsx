'use client';

import PasswordResetForm from "@/components/PasswordResetForm";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#808ce6] via-[#8fa0ec] to-[#9fa5f0] p-4">
      <PasswordResetForm />
    </main>
  );
}