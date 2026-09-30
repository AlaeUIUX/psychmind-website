import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { Container, Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Tag, VerifiedBadge } from "@/components/ui/tag";

const specialtyGroups = [
  { label: "Anxiety & mood", tags: ["Individuals", "Couples", "Adults 18+"] },
  { label: "Trauma", tags: ["Trauma & PTSD", "Grief & loss"] },
  {
    label: "Relationships & identity",
    tags: ["Relationship issues", "Self-esteem", "Life transitions", "Cultural identity"],
  },
];

const credentials = [
  {
    label: "License",
    lines: ["Clinical Psychologist", "Verified by PsychMind · License #MA-2941"],
  },
  { label: "Education", lines: ["Ph.D. Clinical Psychology", "Université Mohammed V, Rabat · 2015"] },
  { label: "Experience", lines: ["9 years in practice"] },
  { label: "Languages", lines: ["French, English"] },
  { label: "Session types", lines: ["Individual · Couples"] },
];

const highlights = [
  { title: "Verified badges", body: "Credentials manually checked by the PsychMind team" },
  {
    title: "Message before request",
    body: "Message before request — no commitment until you’re ready",
  },
];

// Visual stand-in for a button inside the illustrative profile — looks like
// the real thing but isn't focusable or announced as a control.
function MockButton({ children, primary }: { children: ReactNode; primary?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        primary
          ? "flex h-10 items-center justify-center rounded-field bg-brand-primary type-small font-medium text-white shadow-control"
          : "flex h-10 items-center justify-center gap-1.5 rounded-field border border-warm-300 bg-white type-small font-medium text-warm-800 shadow-control"
      }
    >
      {children}
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="type-small font-medium text-text-primary">{children}</p>;
}

function Body({ children }: { children: ReactNode }) {
  return <p className="type-small text-text-secondary">{children}</p>;
}

export function ProfileShowcase() {
  return (
    <Section>
      <Container className="flex flex-col gap-10 sm:gap-12">
        <SectionHeader
          badge={{ icon: "/images/how-it-works/profiles-badge-icon.svg", label: "Profiles" }}
          title="Everything you need before you decide"
          subtitle="Each profile gives you the full picture — no guessing, no surprises."
        />

        {/* Sample provider profile — an illustrative mockup, not a live/interactive profile */}
        <Reveal className="relative w-full overflow-hidden rounded-card bg-warm-50 shadow-card ring-1 ring-warm-200">
          <div className="relative h-24">
            <Image src="/images/how-it-works/profile-banner.png" alt="" fill className="object-cover" />
          </div>

          <div className="relative -mt-14 flex items-end justify-between px-6">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-4xl border-4 border-white bg-white shadow-card">
              <Image src="/images/providers/sara-oliisi-portrait.jpg" alt="" fill className="object-cover" />
            </div>
            <span
              aria-hidden
              className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-pill border border-warm-300 bg-white px-3.5 type-small font-medium text-warm-800 shadow-control"
            >
              <img src="/images/how-it-works/back-arrow-icon.svg" alt="" width={14} height={14} />
              Go back to results
            </span>
          </div>

          <div className="relative flex flex-col gap-8 px-6 pb-6 lg:flex-row">
            <div className="flex max-h-[600px] flex-1 flex-col gap-6 overflow-hidden">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="type-title text-text-primary">Sara Oliisi</p>
                  <VerifiedBadge />
                </div>
                <div className="flex items-center gap-2 type-body text-text-secondary">
                  <img src="/images/how-it-works/check-icon.svg" alt="" width={16} height={16} />
                  <span>Counselor, LMHC, M.S., B.S.</span>
                  <span className="text-text-tertiary">she/her</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Tag>Online &amp; in-person</Tag>
                  <Tag>
                    Miami, FL 33131
                    <img src="/images/how-it-works/pin-icon.svg" alt="" className="ml-0.5 inline" width={13} height={16} />
                  </Tag>
                </div>
              </div>

              <hr className="border-warm-200" />

              <div className="flex flex-col gap-3">
                <Label>Who I work with</Label>
                <Body>
                  I primarily work with adults (18+) on an individual basis, though I also offer
                  couples sessions. My clients often come to me when they feel like they&apos;ve
                  tried to manage things on their own and need a different kind of support — not
                  advice, but a space to think more clearly.
                </Body>
                <Body>
                  I work especially well with people who are skeptical about therapy, or who have
                  tried it before and felt it wasn&apos;t quite right. I take that seriously and we
                  talk about it openly.
                </Body>
                <div className="flex gap-1.5">
                  <Tag>Individuals</Tag>
                  <Tag>Couples</Tag>
                  <Tag>Adults 18+</Tag>
                </div>
              </div>

              <hr className="border-warm-200" />

              <div className="flex flex-col gap-3">
                <Label>About Sara</Label>
                <Body>
                  I work with adults who feel stuck, overwhelmed, or disconnected from the life
                  they want to be living. Many of my clients are navigating anxiety, stress,
                  relationship challenges, or questions about identity — and they&apos;ve often
                  been carrying these things alone for a long time before reaching out.
                </Body>
                <Body>
                  My approach is collaborative and paced to your comfort. I don&apos;t believe
                  therapy should feel like homework or a checklist. I believe it should feel like a
                  conversation where you are genuinely heard — sometimes for the first time.
                </Body>
                <p className="w-fit type-small font-medium text-text-primary underline underline-offset-2">Read more</p>
              </div>

              <hr className="border-warm-200" />

              <div className="flex flex-col gap-3">
                <Label>Specialties</Label>
                <div className="flex flex-col gap-3">
                  {specialtyGroups.map((group) => (
                    <div key={group.label} className="flex flex-col gap-2.5">
                      <p className="type-overline text-text-tertiary">{group.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-warm-200" />

              <div className="flex flex-col gap-4">
                <Label>Credentials &amp; qualifications</Label>
                {credentials.map((c) => (
                  <div key={c.label} className="flex items-start justify-between gap-6">
                    <p className="type-overline shrink-0 text-text-tertiary">{c.label}</p>
                    <div className="flex max-w-[341px] flex-col gap-1 text-right">
                      {c.lines.map((line, i) => (
                        <p
                          key={line}
                          className={
                            i === 0
                              ? "type-small font-medium text-text-primary"
                              : "type-caption text-text-tertiary"
                          }
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex h-fit w-full shrink-0 flex-col gap-6 rounded-field border border-warm-200 bg-warm-100 p-6 lg:w-[360px]">
              <div className="flex items-center gap-2.5">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-field border border-black/[0.08] bg-white">
                  <Image src="/images/providers/sara-oliisi-portrait.jpg" alt="" fill className="object-cover" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Sara Oliisi</Label>
                  <Body>Counselor, LMHC, M.S., B.S.</Body>
                </div>
              </div>

              <hr className="border-warm-200" />

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <p className="type-overline text-text-tertiary">Individual session</p>
                  <p className="type-small text-text-primary">120 USD</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="type-overline text-text-tertiary">Couples session</p>
                  <p className="type-small text-text-primary">160 USD</p>
                </div>
              </div>

              <hr className="border-warm-200" />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 type-small text-text-secondary">
                  <img src="/images/how-it-works/monitor-icon.svg" alt="" width={16} height={16} />
                  Online &amp; in-person available
                </div>
                <MockButton primary>Request a session</MockButton>
                <MockButton>
                  <img src="/images/how-it-works/phone-icon.svg" alt="" width={16} height={16} />
                  Call provider
                </MockButton>
                <MockButton>
                  <img src="/images/how-it-works/heart-icon.svg" alt="" width={16} height={16} />
                  Save profile
                </MockButton>
              </div>

              <hr className="border-warm-200" />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 type-small text-text-secondary">
                  <img src="/images/how-it-works/shield-icon.svg" alt="" width={16} height={16} />
                  Your info is never shared
                </div>
                <div className="flex items-center gap-2 type-small text-text-secondary">
                  <img src="/images/how-it-works/verified-check-icon.svg" alt="" width={16} height={16} />
                  Credentials manually verified
                </div>
              </div>
            </div>
          </div>

          {/* Fade indicating this is a truncated preview of a real profile */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-warm-50" />
        </Reveal>

        <Reveal stagger className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {highlights.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-card border border-warm-200 bg-warm-25 p-5 sm:p-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warm-100 ring-1 ring-warm-200">
                <img src="/images/how-it-works/license-icon.svg" alt="" width={16} height={16} />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="type-title text-text-primary">{item.title}</h3>
                <p className="type-body text-text-tertiary">{item.body}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
