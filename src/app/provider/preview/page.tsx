import type { Metadata } from "next";
import Link from "next/link";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { ProviderProfileView } from "@/components/provider/profile-view";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, EyeIcon } from "@/components/ui/hugeicons";
import { Container, Section } from "@/components/ui/section";
import { toProfileView } from "@/lib/provider/state";
import { requireRole } from "@/server/auth/session";
import { getDirectoryProvider } from "@/server/directory/data";
import { loadProviderState } from "@/server/provider/data";

export const metadata: Metadata = { title: "Your profile — PsychMind", robots: { index: false } };

// A provider's own profile at full size, opened in a new tab from the editor
// ("View profile"), whatever its status: laid out as patients see it, with the
// provider's latest saved edits, including ones still in review
// (lib/provider/review.ts). Request and Save are inert here.
export default async function ProviderPreviewPage() {
  const { user } = await requireRole("provider", "/provider/preview");
  const state = await loadProviderState(user.id);
  // Live in the directory right now: offer the real public page too.
  const listed = state.status === "approved" ? await getDirectoryProvider(state.publicId) : null;

  // TODO(client): copy.
  const note = listed
    ? state.needsReview
      ? "Your profile with your latest edits. Changes to your name, title, NPI or licenses show to patients once our team approves them."
      : "Your profile as patients see it."
    : state.status === "approved"
      ? "How your profile will look to patients once your listing is active."
      : "How your profile will look to patients once it's verified and live.";

  return (
    <Section spacing="none" className="pt-4 pb-14 sm:pt-6 sm:pb-20">
      <Container size="wide" className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-[20px] border border-warm-900/10 bg-warm-900/[0.04] p-3 pl-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2.5 type-small text-warm-900/70">
            <EyeIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-warm-900/50" />
            <span>
              <span className="font-medium text-warm-900">Preview.</span> {note}
            </span>
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            {listed && (
              <Button asChild variant="ghost" size="sm">
                <Link href={listed.href}>
                  Public page
                  <ArrowUpRightIcon aria-hidden />
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="sm">
              <Link href="/provider/profile">Edit profile</Link>
            </Button>
          </div>
        </div>

        <ProviderProfileView profile={toProfileView(state)} mode="public" />

        <CrisisStrip />
      </Container>
    </Section>
  );
}
