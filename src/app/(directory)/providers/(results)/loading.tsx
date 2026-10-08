import { Container, Section } from "@/components/ui/section";

// Figma S4: the search bar and filters keep their place, the count line
// becomes a spinning logo with "Searching our database...", and the results
// are skeleton cards.

const bar = "animate-pulse rounded-pill bg-warm-100";

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-warm-200 bg-white p-3 lg:flex-row lg:gap-4">
      <div className="flex flex-1 gap-4">
        <div className="size-20 shrink-0 animate-pulse rounded-2xl bg-warm-100 sm:size-[132px]" />
        <div className="flex flex-1 flex-col gap-3 pt-1">
          <div className={`h-5 w-44 ${bar}`} />
          <div className={`h-4 w-60 max-w-full ${bar}`} />
          <div className="hidden h-24 animate-pulse rounded-2xl bg-warm-100 sm:block" />
          <div className="flex gap-1.5">
            {[20, 24, 16].map((w) => (
              <div key={w} className="h-7 rounded-tag border border-warm-200" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="h-28 animate-pulse rounded-2xl bg-warm-100 lg:h-auto lg:w-[250px]" />
    </div>
  );
}

export default function ProvidersLoading() {
  return (
    <Section spacing="none" className="pt-4 pb-14 sm:pt-6 sm:pb-20">
      <Container size="wide">
        <div className="flex flex-col gap-5 rounded-card bg-warm-50 p-3 ring-1 ring-warm-200/70 sm:p-5 lg:p-6">
          <div className="h-16 animate-pulse rounded-[28px] bg-white ring-1 ring-warm-200 lg:h-[104px] lg:rounded-[32px]" />
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="hidden h-[600px] rounded-card border border-warm-200 bg-white p-5 lg:flex lg:flex-col lg:gap-4">
              <div className={`h-5 w-20 ${bar}`} />
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`h-4 w-full ${bar}`} />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <p role="status" className="flex items-center gap-2 type-small text-text-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/home/logo.svg" alt="" className="size-4 animate-spin motion-reduce:animate-none" />
                Searching our database...
              </p>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
