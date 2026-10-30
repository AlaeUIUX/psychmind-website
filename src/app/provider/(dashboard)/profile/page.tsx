import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon } from "@/components/ui/hugeicons";
import { ProfileEditor } from "@/components/provider/profile-editor";
import { sectionStatuses } from "@/lib/provider/completeness";
import { STEP_KEYS, type StepKey } from "@/lib/provider/steps";
import { requireRole } from "@/server/auth/session";
import type { SectionKey } from "@/server/provider/actions";
import { loadProviderState } from "@/server/provider/data";

export const metadata: Metadata = { title: "Your profile — PsychMind" };

// TODO(client): copy for the locked states, and the verified description
// (most changes are instant; name, title, NPI and licenses are checked first).
const LOCKED: Record<string, string> = {
  submitted: "Your profile is being reviewed. You can edit it again once our team has finished — usually within 1–2 business days.",
  rejected: "Your profile can't be edited. Contact us if you have questions about our decision.",
  suspended: "Your profile can't be edited while it's suspended. Contact us for help.",
};

export default async function ProviderProfilePage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { user } = await requireRole("provider", "/provider/profile");
  const state = await loadProviderState(user.id);
  const { section } = await searchParams;
  const key = (STEP_KEYS.includes(section as StepKey) && section !== "review" ? section : "identity") as SectionKey;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Profile", href: "/provider/profile" }, { label: [state.firstName, state.lastName].join(" ").trim() || "Your profile" }]}
        title="Your public profile"
        description={
          state.status === "approved"
            ? "Edit any part of your profile. Most changes show as soon as you save; our team checks changes to your name, title, NPI and licenses first."
            : "Edit any part of your profile. Changes appear on your public profile as soon as you save."
        }
        actions={
          <Button asChild variant="secondary" size="sm">
            <a href="/provider/preview" target="_blank" rel="noopener">
              View profile
              <ArrowUpRightIcon aria-hidden />
            </a>
          </Button>
        }
      />
      <ProfileEditor state={state} section={key} sections={sectionStatuses(state)} locked={LOCKED[state.status]} />
    </>
  );
}
