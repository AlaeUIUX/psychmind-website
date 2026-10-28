"use client";

import { RequestVisual, SearchVisual, VerifiedVisual } from "@/components/home/bento-previews";
import { BadgeCheckIcon, InboxIcon, SearchIcon } from "@/components/ui/hugeicons";
import { ProcessSteps, type Step, type StepsHead } from "./process-steps";

// How it works for providers: the three steps in the people-side card (process-steps.tsx),
// from the provider's side, with the bento's pictures: a profile being verified, someone
// searching, and a request coming in.
// TODO(client): new copy, all of it (2026-10-28).

const steps: Step[] = [
  {
    title: "Build your profile and get verified",
    description:
      "Show how you practice: your approach, specialties, the states you're licensed in, your locations, session types and fees. Our team checks your license before your profile goes live.",
    Icon: BadgeCheckIcon,
    picture: (active) => <VerifiedVisual active={active} />,
  },
  {
    title: "Get found by the right people",
    description:
      "People search by what they'd like to work on, where they are and how they'd like to meet. Your profile shows up when it fits, in person near your locations and online in every state you're licensed in.",
    Icon: SearchIcon,
    picture: (active) => <SearchVisual active={active} />,
  },
  {
    title: "Hear from them directly",
    description:
      "Session requests come straight to your inbox with the person's contact details, so you reply in your own way. Every request is in your dashboard too.",
    Icon: InboxIcon,
    picture: (active) => <RequestVisual active={active} />,
  },
];

const head: StepsHead = {
  title: "From sign-up to first request",
  intro: [
    [{ text: "Most directories make you fit their boxes, " }, { text: "we don’t…", strong: true }],
    [
      { text: "List every state, license and location you practice in, " },
      { text: "and see how people find you from your dashboard.", strong: true },
    ],
  ],
};

export function ProviderSteps() {
  return <ProcessSteps title="Three steps to your first request" steps={steps} head={head} />;
}
