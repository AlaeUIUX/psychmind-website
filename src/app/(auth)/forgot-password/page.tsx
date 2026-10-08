import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Reset your password — PsychMind" };

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPasswordForm />
    </>
  );
}
