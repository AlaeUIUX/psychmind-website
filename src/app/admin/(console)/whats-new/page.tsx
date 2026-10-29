import type { Metadata } from "next";
import { WhatsNew } from "@/components/app/whats-new";
import { changelogFor } from "@/lib/changelog";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "What's new — PsychMind" };

export default async function AdminWhatsNewPage() {
  await requireRole("admin", "/admin/whats-new");
  return <WhatsNew entries={changelogFor("admin")} />;
}
