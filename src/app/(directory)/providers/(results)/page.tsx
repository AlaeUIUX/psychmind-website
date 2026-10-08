import type { Metadata } from "next";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { EmptyState } from "@/components/app/empty-state";
import { DirectoryBrowser } from "@/components/directory/directory-browser";
import { SampleNotice } from "@/components/directory/sample-notice";
import type { Viewer } from "@/components/directory/save-button";
import { DoodleMagnifier } from "@/components/ui/doodles";
import { Container, Section } from "@/components/ui/section";
import { getSession } from "@/server/auth/session";
import { listDirectory, savedProfileIds } from "@/server/directory/data";

// Search results (Figma S1), before the search engine: every listed provider,
// with a quick view beside the list. Search and filters come with slice 8.

export async function generateMetadata(): Promise<Metadata> {
  const providers = await listDirectory();
  return {
    title: "Browse providers — PsychMind",
    // TODO(client): copy.
    description: "Licensed mental health providers, each verified by PsychMind before they're listed.",
    // Sample profiles stay out of search engines.
    robots: providers.some((p) => p.isSample) ? { index: false, follow: false } : undefined,
  };
}

export default async function ProvidersPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const session = await getSession();
  const [{ p: initialId }, providers] = await Promise.all([searchParams, listDirectory()]);
  const role = (session?.user.role ?? null) as Viewer["role"];
  const savedIds = session && role === "patient" ? await savedProfileIds(session.user.id) : [];
  const samples = providers.some((p) => p.isSample);

  return (
    <Section spacing="none" className="pt-4 pb-14 sm:pt-6 sm:pb-20">
      <Container size="wide" className="flex flex-col gap-6">
        <h1 className="sr-only">Browse providers</h1>
        <div className="flex flex-col gap-4 rounded-card bg-warm-50 p-3 ring-1 ring-warm-200/70 sm:p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
            <p className="type-small text-text-secondary" aria-live="polite">
              <span className="font-semibold text-text-primary">{providers.length}</span>
              {providers.length === 1 ? " provider found" : " providers found"}
            </p>
            <p className="flex items-center gap-1.5 type-small text-text-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/how-it-works/verified-check-icon.svg" alt="" className="size-4" />
              Verified by PsychMind
            </p>
          </div>
          {samples && <SampleNotice />}

          {providers.length ? (
            <DirectoryBrowser providers={providers} savedIds={savedIds} viewer={{ role }} initialId={initialId} />
          ) : (
            // TODO(client): copy.
            <EmptyState art={<DoodleMagnifier className="size-10" />} title="Providers are on their way">
              We&apos;re verifying our first providers now. Please check back soon.
            </EmptyState>
          )}
        </div>

        <CrisisStrip />
      </Container>
    </Section>
  );
}
