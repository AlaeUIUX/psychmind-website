import type { Metadata } from "next";
import { RoleSelect } from "@/components/auth/role-select";

export const metadata: Metadata = { title: "Create an account — PsychMind" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return (
    <>
      <RoleSelect initial={role === "provider" || role === "patient" ? role : undefined} />
    </>
  );
}
