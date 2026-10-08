import { Container, Section } from "@/components/ui/section";

// Figma S4: the count line becomes a spinning logo with "Searching our
// database...", over skeleton cards.

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <div className="size-16 shrink-0 animate-pulse rounded-2xl bg-warm-100 sm:size-[72px]" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <div className="h-4 w-40 animate-pulse rounded-pill bg-warm-100" />
          <div className="h-3 w-56 max-w-full animate-pulse rounded-pill bg-warm-100" />
          <div className="h-6 w-28 rounded-tag border border-warm-200" />
        </div>
      </div>
      <div className="h-16 animate-pulse rounded-field bg-warm-100" />
      <div className="flex gap-1.5">
        {[20, 24, 16, 20].map((w, i) => (
          <div key={i} className="h-6 rounded-tag border border-warm-200" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
    </div>
  );
}

export default function ProvidersLoading() {
  return (
    <Section spacing="none" className="pt-4 pb-14 sm:pt-6 sm:pb-20">
      <Container size="wide">
        <div className="flex flex-col gap-4 rounded-card bg-warm-50 p-3 ring-1 ring-warm-200/70 sm:p-5 lg:p-6">
          <p role="status" className="flex items-center gap-2 px-1 type-small text-text-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/home/logo.svg" alt="" className="size-4 animate-spin motion-reduce:animate-none" />
            Searching our database...
          </p>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,480px)]">
            <div className="flex flex-col gap-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="hidden h-[560px] animate-pulse rounded-card border border-warm-200 bg-white lg:block" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
