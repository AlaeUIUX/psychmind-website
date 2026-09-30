import { Reveal } from "@/components/reveal";
import { Container, Section } from "@/components/ui/section";
import { SectionBadge } from "@/components/ui/section-badge";

const LINE = "PsychMind is our attempt to close that gap";

/** A strip of lavender washi tape stuck across one corner of the paper. */
function Tape({ corner }: { corner: "top-right" | "bottom-left" }) {
  return (
    <span
      aria-hidden
      className={
        "tape pointer-events-none absolute z-10 h-9 w-28 rotate-45 bg-tape-lilac/90 shadow-[0_1px_2px_rgb(28_25_23/0.06)] sm:h-12 sm:w-44 md:h-[56px] md:w-[200px] " +
        (corner === "top-right"
          ? "top-0 right-0 translate-x-[38%] -translate-y-[30%]"
          : "bottom-0 left-0 -translate-x-[38%] translate-y-[30%]")
      }
    />
  );
}

export function MissionTeaser() {
  return (
    // overflow-x-clip: the corner tapes hang past the note, into the gutter.
    <Section className="overflow-x-clip">
      <Container className="flex flex-col items-start gap-8 sm:gap-10">
        <Reveal stagger className="flex flex-col items-start gap-8 sm:gap-10">
          <SectionBadge icon="/images/home/meet-creators-icon.svg">Meet the creators</SectionBadge>
          {/* Figma applies no object-fit override here (defaults to stretch-to-fill on
              the square source), so the illustration is intentionally non-uniformly
              scaled to this exact 436:347 box rather than letterboxed or cropped. */}
          <span className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/home/mission-illustration.png"
              alt=""
              className="h-[175px] w-[220px] animate-float sm:h-[347px] sm:w-[436px]"
            />
          </span>
        </Reveal>

        {/* The note is "taped" to the page: one strip across the top-right
            corner, one across the bottom-left, both pressed on after it lands. */}
        <Reveal className="relative w-full">
          <Tape corner="top-right" />
          <Tape corner="bottom-left" />

          <div data-note className="paper-bg relative w-full overflow-hidden rounded-field shadow-raised">
            <div className="absolute inset-0 bg-warm-25/60" />
            <div className="relative flex flex-col gap-8 pt-10 pb-10 sm:gap-12 sm:pt-12 sm:pb-12 md:pt-14 md:pb-14">
              <p className="type-statement px-6 text-warm-900/55 sm:px-16 md:px-24">
                We started <span className="text-warm-900">PsychMind</span> because{" "}
                <span className="text-warm-900 underline decoration-1 underline-offset-[0.18em]">
                  people spent too long looking for help
                </span>{" "}
                and not finding it — not because the help wasn&apos;t there, but because the
                path to it was{" "}
                <span className="text-warm-900">confusing, cold, and sometimes just discouraging</span>
                . We&apos;re two people who believe that finding a provider should feel{" "}
                <span className="text-warm-900">as safe as the therapy itself.</span>
              </p>

              {/* The closing line, written on a strip of tape that runs across the
                  note. Hovering the note sets it drifting left and back. */}
              <div className="relative -mx-2 -rotate-[1.2deg] border-y border-white/60 bg-tape-lilac/55 py-3 sm:py-4">
                <p className="sr-only">{LINE}</p>
                <div aria-hidden className="overflow-hidden">
                  <div className="tape-marquee flex w-max gap-8 pl-6 sm:gap-12 sm:pl-16 md:pl-24">
                    {Array.from({ length: 6 }, (_, i) => (
                      <span key={i} className="flex shrink-0 items-center gap-8 sm:gap-12">
                        <span className="font-display text-xl text-warm-800 italic sm:text-display-xs md:text-display-sm">
                          {LINE}
                        </span>
                        <span className="text-lg text-warm-600/50 sm:text-xl">✦</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
