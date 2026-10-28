// How it works for providers asks its own (providerFaqs, at the end).
// Placeholder answers until the client supplies final copy. An entry without
// an answer renders as a plain, non-expandable row. `crisis`: the row is the crisis
// card's help instead (always open), on How it works.
export type Faq = { question: string; answer?: string; crisis?: boolean };

export const faqs: Faq[] = [
  {
    question: "Is my search completely private?",
    answer:
      "Yes. We never share your personal information with anyone: not your provider, not third parties. Your search is yours alone.",
  },
  {
    question: "What if I pick the wrong person?",
    answer:
      "That's completely okay. Finding the right fit sometimes takes more than one try. You can reach out to a different provider at any time, with no fees or awkward explanations needed. Fit matters more than anything, so we make it easy to keep looking.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "Each provider sets their own cancellation policy, and it's always shown on their profile before you send a request. Most ask for at least 24 hours' notice if you need to reschedule or cancel.",
  },
  {
    question: "Do I need a referral or diagnosis?",
    answer:
      "No. You can search, message providers and request a session without a referral or a diagnosis. If your insurance plan requires one, your provider can walk you through the next steps.",
  },
  {
    question: "Do providers accept insurance?",
    answer:
      "Many do. Use the insurance filter to see providers who accept your plan, and check each profile for details. Session fees are set by each provider and are always listed upfront.",
  },
  {
    question: "Can I see someone online?",
    answer:
      "Yes. Filter by Online to find providers who offer video sessions, or In-person to find someone near you. Many providers offer both, so you can switch whenever it suits you.",
  },
  {
    question: "Is PsychMind a therapy service?",
    answer:
      "No. PsychMind is a directory that helps you find and contact independent, verified providers. Your care, scheduling and payments are arranged directly between you and the provider you choose.",
  },
  {
    question: "What if I need help right now?",
    crisis: true,
    answer:
      "If you're in crisis or thinking about harming yourself, call or text 988 to reach the Suicide & Crisis Lifeline, available 24/7. In an emergency, call 911. PsychMind isn't designed for urgent or emergency care.",
  },
];

// TODO(client): new copy, all of it (2026-10-28). The price is left out until it's set
// (build plan D9).
export const providerFaqs: Faq[] = [
  {
    question: "Who can join PsychMind?",
    answer:
      "Licensed mental health providers in the US, including psychologists, therapists and medication management providers. Each state you list needs an active license.",
  },
  {
    question: "How does verification work?",
    answer:
      "When you submit your profile, our team checks your license and credentials. We'll email you once you're verified, and then you activate your listing to appear in search. If anything needs changing first, we'll tell you what.",
  },
  {
    question: "How do session requests reach me?",
    answer:
      "Each request is emailed to the address you choose, with the person's name, contact details and an optional note, and you reply to them directly. You'll find every request in your dashboard too, where you can mark it as contacted.",
  },
  {
    question: "Can I list more than one state or location?",
    answer:
      "Yes. Add every state you're licensed in and every place you practice. In-person searches match your locations, and online searches match the states you're licensed in.",
  },
  {
    question: "Can I see how my profile is doing?",
    answer:
      "Yes. Your dashboard shows how often you appear in searches, how many people view your profile and how many send a request, over the dates you choose.",
  },
  {
    question: "Can I change my profile later?",
    answer:
      "Yes. You can edit any part of your profile from your dashboard, at any time.",
  },
];
