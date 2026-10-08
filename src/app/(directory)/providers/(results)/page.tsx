import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { EmptyState } from "@/components/app/empty-state";
import { SampleNotice } from "@/components/directory/sample-notice";
import type { Viewer } from "@/components/directory/save-button";
import { SearchApp } from "@/components/search/search-app";
import { DoodleMagnifier } from "@/components/ui/doodles";
import { Container, Section } from "@/components/ui/section";
import { searchDirectory } from "@/lib/search/engine";
import { activeFilterCount, loadSearchFilters } from "@/lib/search/filters";
import { getSession } from "@/server/auth/session";
import { listDirectory, savedProfileIds, type DirectoryProvider } from "@/server/directory/data";

// Search results (Figma S1): the search engine over every listed provider.
// Filters live in the URL; each change re-runs the search here.

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [providers, filters] = await Promise.all([listDirectory(), searchParams.then(loadSearchFilters)]);
  return {
    title: "Browse providers — PsychMind",
    // TODO(client): copy.
    description: "Licensed mental health providers, each verified by PsychMind before they're listed.",
    // Sample profiles and filtered searches stay out of search engines.
    robots: providers.some((p) => p.isSample) || activeFilterCount(filters) ? { index: false, follow: false } : undefined,
  };
}

/** "City, ST" for each in-person practice, most providers first ("Where?" suggestions). */
function practiceCities(providers: DirectoryProvider[]) {
  const counts = new Map<string, number>();
  for (const p of providers) {
    for (const l of p.locations ?? []) {
      if (!l.formats.includes("in_person")) continue;
      const key = `${l.city}, ${l.state}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c);
}

export default async function ProvidersPage({ searchParams }: Props) {
  const session = await getSession();
  const params = await searchParams;
  const filters = loadSearchFilters(params);
  const providers = await listDirectory();
  const result = searchDirectory(providers, filters);
  const role = (session?.user.role ?? null) as Viewer["role"];
  const savedIds = session && role === "patient" ? await savedProfileIds(session.user.id) : [];
  const openId = typeof params.p === "string" ? params.p : null;
  const selected = openId ? (providers.find((p) => p.publicId === openId) ?? null) : null;

  return (
    <Section spacing="none" className="pt-4 pb-14 sm:pt-6 sm:pb-20">
      <Container size="wide" className="flex flex-col gap-6">
        <h1 className="sr-only">Browse providers</h1>
        <div className="flex flex-col gap-5 rounded-card bg-warm-50 p-3 ring-1 ring-warm-200/70 sm:p-5 lg:p-6">
          {providers.some((p) => p.isSample) && <SampleNotice />}
          {providers.length ? (
            <NuqsAdapter>
              <SearchApp result={result} viewer={{ role }} savedIds={savedIds} cities={practiceCities(providers)} selected={selected} />
            </NuqsAdapter>
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
