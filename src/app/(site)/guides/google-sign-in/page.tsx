import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { PageHero } from "@/components/ui/page-hero";
import { Container, Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Turn on “Continue with Google” — PsychMind",
  description: "A step-by-step guide for the PsychMind team to set up Google sign-in.",
  robots: { index: false, follow: false },
};

// A setup guide the developer wrote for the client (Dee), shared by link and
// kept out of search engines. Her part is only creating the Google Cloud
// project and adding the developer as Owner; the OAuth setup itself is the
// developer's (docs/live-testing.md). Google renames its menus now and then:
// check the labels below against console.cloud.google.com when editing.

type Step = { title: string; body: ReactNode[]; check?: ReactNode };

const STEPS: Step[] = [
  {
    title: "Open Google Cloud",
    body: [
      <>
        Go to <Ext href="https://console.cloud.google.com">console.cloud.google.com</Ext> and sign in with the Google account PsychMind
        should belong to.
      </>,
      "Look at the round photo or letter in the top-right corner. That's the account you're using. If it's the wrong one, click it and choose the right account.",
    ],
  },
  {
    title: "Accept Google's terms (first visit only)",
    body: [
      "The first time, a welcome window asks for your country and asks you to agree to the Terms of Service.",
      <>
        Choose <B>United States</B>, tick the box to agree, then click <B>Agree and continue</B>.
      </>,
      <>
        If Google offers a free trial or asks for a credit card, skip it (<B>Dismiss</B> or close the window). Nothing here costs money.
      </>,
    ],
  },
  {
    title: "Create the PsychMind project",
    body: [
      <>
        In the top bar, next to the Google Cloud logo, click the project button. It may say <B>Select a project</B>.
      </>,
      <>
        In the window that opens, click <B>New project</B> (top right).
      </>,
      <>
        For <B>Project name</B>, type <B>PsychMind</B>. Leave everything else as it is, then click <B>Create</B>.
      </>,
      <>
        Wait a few seconds, click the project button again and choose <B>PsychMind</B>.
      </>,
    ],
    check: "The top bar now says PsychMind.",
  },
  {
    title: "Add me to the project",
    body: [
      <>
        Click the search bar at the top, type <B>IAM</B>, and choose <B>IAM</B>{" "}(it says &ldquo;IAM &amp; Admin&rdquo; under it).
      </>,
      <>
        Click <B>Grant access</B>.
      </>,
      <>
        In <B>New principals</B>, paste the email address I sent you with this link.
      </>,
      <>
        Click <B>Select a role</B>, type <B>Owner</B>, and choose <B>Owner</B>{" "}(it&rsquo;s under &ldquo;Basic&rdquo;).
      </>,
      <>
        Click <B>Save</B>. If Google asks you to confirm because the address is outside your account, confirm.
      </>,
    ],
    check: "My email is in the list with the role Owner, or Google says an invitation was sent.",
  },
  {
    title: "Tell me it's done",
    body: ["Send me a quick message. That's all from your side."],
  },
];

const BEFORE = [
  "A computer. Google Cloud is hard to use on a phone.",
  "The Google account PsychMind should belong to. Use the business account if you have one: it will own this setup for years, so avoid a personal Gmail you might close one day.",
  "The email address I sent you along with this link.",
];

export default function GoogleSignInGuide() {
  return (
    <>
      <PageHero
        eyebrow="Setup guide"
        title="Turn on “Continue with Google”"
        subtitle="About 10 minutes, no technical settings. You create PsychMind's space in Google Cloud and let me in; I do the rest."
        className="pb-10 sm:pb-14"
      />

      <Section spacing="none" className="pb-20 sm:pb-28 md:pb-32">
        <Container size="prose" className="flex flex-col gap-12">
          <Reveal className="flex flex-col gap-4 rounded-card border border-warm-900/10 bg-warm-900/[0.03] p-6 sm:p-7">
            <h2 className="type-h4 text-text-primary">Before you start</h2>
            <ul className="flex flex-col gap-3 type-body-lg text-text-tertiary">
              {BEFORE.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-warm-900/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <ol className="flex flex-col gap-10">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} as="li" className="flex gap-4 sm:gap-6">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warm-900 type-small font-medium text-white"
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-3 pt-1">
                  <h2 className="type-h4 text-text-primary">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h2>
                  <div className="flex flex-col gap-3 type-body-lg text-text-tertiary">
                    {step.body.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                  {step.check && (
                    <p className="flex gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 type-body text-emerald-900">
                      <span aria-hidden>✓</span>
                      <span>
                        <span className="font-medium">You should see: </span>
                        {step.check}
                      </span>
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal className="flex flex-col gap-4">
            <h2 className="type-h4 text-text-primary">What happens next</h2>
            <div className="flex flex-col gap-4 type-body-lg text-text-tertiary">
              <p>
                I set up the Google sign-in screen with PsychMind&rsquo;s name, connect it to psychmind.org, test it, and switch it on.
                Patients and providers then see <B>Continue with Google</B> when they log in or sign up.
              </p>
              <p>
                Google may email you about the new project. There&rsquo;s nothing to do. If Google ever asks the owner of psychmind.org to
                confirm the address, I&rsquo;ll send you a separate short guide.
              </p>
            </div>
          </Reveal>

          <Reveal className="flex flex-col gap-4">
            <h2 className="type-h4 text-text-primary">Good to know</h2>
            <div className="flex flex-col gap-4 type-body-lg text-text-tertiary">
              <p>
                <B>The project stays yours.</B> Owner lets me set up and look after sign-in for you. You can remove my access any time on
                the same IAM page.
              </p>
              <p>
                <B>Screens look different?</B> Google changes its menus from time to time. Take a screenshot and send it to me. There&rsquo;s
                nothing you can break.
              </p>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}

function B({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-text-primary">{children}</strong>;
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-text-primary underline underline-offset-2">
      {children}
    </a>
  );
}
