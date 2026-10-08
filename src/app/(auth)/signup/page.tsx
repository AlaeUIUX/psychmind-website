import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RoleSelect } from "@/components/auth/role-select";

export const metadata: Metadata = { title: "Create an account — PsychMind" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return (
    <AuthShell>
      <RoleSelect initial={role === "provider" ? "provider" : "patient"} />
    </AuthShell>
  );
}
