import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SignUpForm } from "@/components/auth/signup-form";
import { authFeatures } from "@/server/auth/features";

export const metadata: Metadata = { title: "Create your account — PsychMind" };

export function generateStaticParams() {
  return [{ role: "patient" }, { role: "provider" }];
}

export default async function SignUpRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { role } = await params;
  if (role !== "patient" && role !== "provider") notFound();
  // Patients signing up from a provider page (to save them) go back there.
  const { next } = await searchParams;
  return (
    <>
      <SignUpForm role={role} googleEnabled={authFeatures.google} next={role === "patient" ? next : undefined} />
    </>
  );
}
