import type { Metadata } from "next";
import { WhatsNew } from "@/components/app/whats-new";
import { changelogFor } from "@/lib/changelog";

export const metadata: Metadata = { title: "What's new — PsychMind" };

export default function ProviderWhatsNewPage() {
  return <WhatsNew entries={changelogFor("provider")} />;
}
