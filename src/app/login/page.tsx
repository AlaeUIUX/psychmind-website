import type { Metadata } from "next";
import { LoginForm } from "@/components/login/login-form";

export const metadata: Metadata = {
  title: "Log in — PsychMind",
  description: "Log in to your PsychMind account.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-[896px]">
        <LoginForm />
      </div>
    </div>
  );
}
