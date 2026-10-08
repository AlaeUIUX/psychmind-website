import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SignUpForm } from "@/components/auth/signup-form";
import { authFeatures } from "@/server/auth/features";

export const metadata: Metadata = { title: "Create your account — PsychMind" };

export function generateStaticParams() {
  return [{ role: "patient" }, { role: "provider" }];
}

export default async function SignUpRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (role !== "patient" && role !== "provider") notFound();
  return (
    <>
      <SignUpForm role={role} googleEnabled={authFeatures.google} />
    </>
  );
}
