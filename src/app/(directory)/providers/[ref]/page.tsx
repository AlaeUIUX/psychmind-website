import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { RequestSessionButton, ShareButton, VerifiedExplainer } from "@/components/directory/profile-actions";
import { SampleNotice } from "@/components/directory/sample-notice";
import { TrackProfile } from "@/components/directory/track-profile";
import { SaveButton, SavedProvidersProvider, type Viewer } from "@/components/directory/save-button";
import { ProviderProfileView } from "@/components/provider/profile-view";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { displayName, licensedStates, locationLabel, shortName } from "@/lib/provider/display";
import { decodeSegment, parseProfileRef } from "@/lib/provider/links";
import { getSession } from "@/server/auth/session";
import { getDirectoryProvider, isProviderSaved } from "@/server/directory/data";

// A provider's public profile (Figma P1 / P1m), opened in a new tab from the
// results. The link carries the provider's public id: /providers/{name}-{id}.

const providerFor = cache(async (ref: string) => {
  const id = parseProfileRef(ref);
  return id ? getDirectoryProvider(id) : null;
});

type Props = { params: Promise<{ ref: string }>; searchParams: Promise<{ save?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await providerFor((await params).ref);
  if (!p) return { title: "Provider not found — PsychMind", robots: { index: false } };
  const name = displayName(p);
  const where = locationLabel(p);
  return {
    title: `${name}${p.titleCredentials ? `, ${p.titleCredentials}` : ""} — PsychMind`,
    // Facts only: no health claims (build plan, slice 7).
    description: [p.titleCredentials, where, "Verified by PsychMind"].filter(Boolean).join(" · "),
    alternates: { canonical: p.href },
    robots: p.isSample ? { index: false, follow: false } : undefined,
  };
}

export default async function ProviderProfilePage({ params, searchParams }: Props) {
  const session = await getSession();
  const [{ ref }, { save }] = await Promise.all([params, searchParams]);
  const p = await providerFor(ref);
  if (!p) notFound();
  // Old or hand-typed names still work; the address bar shows the current one.
  if (`/providers/${decodeSegment(ref)}` !== p.href) permanentRedirect(save ? `${p.href}?save=1` : p.href);

  const role = (session?.user.role ?? null) as Viewer["role"];
  const viewer: Viewer = { role };
  const saved = session && role === "patient" ? await isProviderSaved(session.user.id, p.id) : false;
  const name = displayName(p);
  const first = shortName(p);
  // Back to the results, scrolled to this provider.
  const results = `/providers#provider-${p.publicId}`;

  return (
    <Section spacing="none" className="pt-4 pb-14 sm:pt-6 sm:pb-20">
      <Container size="wide" className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 rounded-card bg-warm-50 px-3 py-4 ring-1 ring-warm-200/70 sm:px-8 sm:py-6 lg:px-12">
          <Breadcrumb>
            <BreadcrumbList className="gap-1.5 font-medium text-text-tertiary sm:gap-2">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={results}>Search results</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/providers">Providers</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-text-secondary underline underline-offset-4">{name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {p.isSample && <SampleNotice single />}
          <TrackProfile publicId={p.publicId} />

          <SavedProvidersProvider initial={saved ? [p.id] : []}>
            <ProviderProfileView
              profile={p}
              mode="public"
              verifiedSlot={<VerifiedExplainer name={first} states={licensedStates(p)} />}
              bannerAction={
                <Button asChild variant="secondary" size="sm" className="h-9 bg-white px-3.5 @3xl:px-6">
                  <Link href={results}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/how-it-works/back-arrow-icon.svg" alt="" className="size-4" />
                    <span className="@3xl:hidden">Go back</span>
                    <span className="hidden @3xl:inline">Go back to results</span>
                  </Link>
                </Button>
              }
              actions={
                <>
                  <RequestSessionButton
                    provider={{ id: p.id, name: first, bannerStyle: p.bannerStyle, isSample: p.isSample, acceptingNewClients: p.acceptingNewClients }}
                    viewer={viewer}
                    saved={saved}
                    returnTo={p.href}
                  />
                  <SaveButton
                    profileId={p.id}
                    name={first}
                    initialSaved={saved}
                    viewer={viewer}
                    returnTo={p.href}
                    variant="full"
                    autoSave={save === "1"}
                  />
                </>
              }
            />
          </SavedProvidersProvider>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-warm-200 pt-4">
            {/* TODO(client): copy. */}
            <p className="type-small text-text-tertiary">
              Something wrong with this profile?{" "}
              <Link href="/contact" className="font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary">
                Let us know
              </Link>
            </p>
            <ShareButton path={p.href} name={name} />
          </div>
        </div>

        <CrisisStrip />
      </Container>
    </Section>
  );
}
