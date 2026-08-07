import Image from "next/image";

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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-warm-300 bg-white px-2.5 py-1 text-sm font-medium text-text-secondary shadow-xs">
      {children}
    </span>
  );
}

export function ProfileShowcase() {
  return (
    <section className="w-full flex flex-col items-center gap-10 px-4 sm:px-12 md:px-20 py-12">
      <div className="flex flex-col items-start gap-6 w-full max-w-[1052px]">
        <span className="inline-flex items-center gap-3 rounded-pill border border-black/10 bg-warm-25 pl-2 pr-[18px] py-2 text-lg font-medium">
          <img src="/images/how-it-works/profiles-badge-icon.svg" alt="" width={32} height={32} />
          <span className="bg-gradient-to-r from-[#44403c] to-[#787878] bg-clip-text text-transparent">
            Profiles
          </span>
        </span>
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-warm-900 text-display-md tracking-[-0.46px]">
            Everything you need before you decide
          </h2>
          <p className="text-warm-600 text-display-xs max-w-[624px]">
            Each profile gives you the full picture — no guessing, no surprises.
          </p>
        </div>
      </div>

      {/* Sample provider profile — an illustrative mockup, not a live/interactive profile */}
      <div className="relative w-full max-w-[1052px] rounded-2xl bg-[#f8f8f6] overflow-hidden">
        <div className="relative h-24">
          <Image src="/images/how-it-works/profile-banner.png" alt="" fill className="object-cover" />
        </div>

        <div className="relative flex items-end justify-between px-6 -mt-14">
          <div className="relative size-28 rounded-3xl border-4 border-white bg-white overflow-hidden shrink-0">
            <Image src="/images/how-it-works/profile-avatar.png" alt="" fill className="object-cover" />
          </div>
          <button className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-warm-300 bg-white px-4 py-2 text-sm font-medium text-warm-800 shadow-sm">
            <img src="/images/how-it-works/back-arrow-icon.svg" alt="" width={16} height={16} />
            Go back to results
          </button>
        </div>

        <div className="relative flex flex-col lg:flex-row gap-8 px-6 pb-6">
          <div className="flex-1 flex flex-col gap-6 max-h-[600px] overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-semibold text-text-primary">Sara Oliisi</p>
                <span className="inline-flex items-center gap-1 rounded-md border border-warm-300 bg-white px-2.5 py-1 text-sm font-medium text-text-secondary shadow-xs">
                  <img src="/images/how-it-works/check-icon.svg" alt="" width={16} height={16} />
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-2 text-md text-text-secondary">
                <img src="/images/how-it-works/check-icon.svg" alt="" width={16} height={16} />
                <span>Counselor, LMHC, M.S., B.S.</span>
                <span className="text-text-tertiary">she/her</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Tag>Online &amp; in-person</Tag>
                <Tag>
                  Miami, FL 33131{" "}
                  <img
                    src="/images/how-it-works/pin-icon.svg"
                    alt=""
                    className="inline ml-1"
                    width={13}
                    height={16}
                  />
                </Tag>
              </div>
            </div>

            <hr className="border-warm-200" />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-text-primary">Who I work with</p>
              <p className="text-sm text-text-secondary">
                I primarily work with adults (18+) on an individual basis, though I also offer
                couples sessions. My clients often come to me when they feel like they&apos;ve
                tried to manage things on their own and need a different kind of support — not
                advice, but a space to think more clearly.
              </p>
              <p className="text-sm text-text-secondary">
                I work especially well with people who are skeptical about therapy, or who have
                tried it before and felt it wasn&apos;t quite right. I take that seriously and we
                talk about it openly.
              </p>
              <div className="flex gap-1.5">
                <Tag>Individuals</Tag>
                <Tag>Couples</Tag>
                <Tag>Adults 18+</Tag>
              </div>
            </div>

            <hr className="border-warm-200" />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-text-primary">About Sara</p>
              <p className="text-sm text-text-secondary">
                I work with adults who feel stuck, overwhelmed, or disconnected from the life
                they want to be living. Many of my clients are navigating anxiety, stress,
                relationship challenges, or questions about identity — and they&apos;ve often
                been carrying these things alone for a long time before reaching out.
              </p>
              <p className="text-sm text-text-secondary">
                My approach is collaborative and paced to your comfort. I don&apos;t believe
                therapy should feel like homework or a checklist. I believe it should feel like a
                conversation where you are genuinely heard — sometimes for the first time.
              </p>
              <p className="text-sm font-medium text-text-primary underline w-fit">Read more</p>
            </div>

            <hr className="border-warm-200" />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-text-primary">Specialties</p>
              <div className="flex flex-col gap-3">
                {specialtyGroups.map((group) => (
                  <div key={group.label} className="flex flex-col gap-3">
                    <p className="text-xs font-medium uppercase text-text-tertiary">{group.label}</p>
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
              <p className="text-sm font-medium text-text-primary">Credentials &amp; qualifications</p>
              {credentials.map((c) => (
                <div key={c.label} className="flex items-start justify-between gap-6">
                  <p className="text-xs font-medium uppercase text-text-tertiary shrink-0">{c.label}</p>
                  <div className="flex flex-col gap-1 text-right max-w-[341px]">
                    {c.lines.map((line, i) => (
                      <p
                        key={line}
                        className={i === 0 ? "text-sm font-medium text-text-primary" : "text-xs text-text-tertiary"}
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
          <div className="w-full lg:w-[360px] shrink-0 rounded-[10px] border border-warm-200 bg-warm-100 p-6 flex flex-col gap-6 h-fit">
            <div className="flex items-center gap-2.5">
              <div className="relative size-16 rounded-xl border border-black/[0.08] bg-white overflow-hidden shrink-0">
                <Image src="/images/how-it-works/profile-avatar.png" alt="" fill className="object-cover" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-text-primary">Sara Oliisi</p>
                <p className="text-sm text-text-secondary">Counselor, LMHC, M.S., B.S.</p>
              </div>
            </div>

            <hr className="border-warm-200" />

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-text-tertiary">Individual session</p>
                <p className="text-sm text-text-primary">120 USD</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-text-tertiary">Couples session</p>
                <p className="text-sm text-text-primary">160 USD</p>
              </div>
            </div>

            <hr className="border-warm-200" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <img src="/images/how-it-works/monitor-icon.svg" alt="" width={16} height={16} />
                Online &amp; in-person available
              </div>
              <button className="rounded-lg bg-brand-primary py-2.5 text-sm font-medium text-white">
                Request a session
              </button>
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-warm-300 bg-white py-2 text-sm font-medium text-warm-800">
                <img src="/images/how-it-works/phone-icon.svg" alt="" width={16} height={16} />
                Call provider
              </button>
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-warm-300 bg-white py-2 text-sm font-medium text-warm-800">
                <img src="/images/how-it-works/heart-icon.svg" alt="" width={16} height={16} />
                Save profile
              </button>
            </div>

            <hr className="border-warm-200" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <img src="/images/how-it-works/shield-icon.svg" alt="" width={16} height={16} />
                Your info is never shared
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <img src="/images/how-it-works/verified-check-icon.svg" alt="" width={16} height={16} />
                Credentials manually verified
              </div>
            </div>
          </div>
        </div>

        {/* Fade indicating this is a truncated preview of a real profile */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#f8f8f6] pointer-events-none" />
      </div>

      <div className="w-full max-w-[1052px] grid grid-cols-1 sm:grid-cols-2 gap-8 px-6">
        <div className="flex flex-col gap-3">
          <img src="/images/how-it-works/license-icon.svg" alt="" width={16} height={16} />
          <p className="text-xl font-semibold text-text-secondary">Verified badges</p>
          <p className="text-md text-text-placeholder">
            Credentials manually checked by the PsychMind team
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <img src="/images/how-it-works/license-icon.svg" alt="" width={16} height={16} />
          <p className="text-xl font-semibold text-text-secondary">Message before request</p>
          <p className="text-md text-text-placeholder">
            Message before request — no commitment until you&apos;re ready
          </p>
        </div>
      </div>
    </section>
  );
}
