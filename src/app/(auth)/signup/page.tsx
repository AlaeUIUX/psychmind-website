import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AgeBlocked } from "@/components/auth/age-blocked";
import { RoleSelect } from "@/components/auth/role-select";
import { AGE_BLOCK_COOKIE } from "@/lib/age";

export const metadata: Metadata = { title: "Create an account — PsychMind" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  if ((await cookies()).get(AGE_BLOCK_COOKIE)) return <AgeBlocked />;
  return (
    <>
      <RoleSelect initial={role === "provider" || role === "patient" ? role : undefined} />
    </>
  );
}
