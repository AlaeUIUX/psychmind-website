// Placeholder answers until the client supplies final copy. An entry without
// an answer renders as a plain, non-expandable row.
export type Faq = { question: string; answer?: string };

export const faqs: Faq[] = [
  {
    question: "Is my search completely private?",
    answer:
      "Yes. We never share your personal information with anyone — not your provider, not third parties. Your search is yours alone.",
  },
  {
    question: "What if I pick the wrong person?",
    answer:
      "That's completely okay — finding the right fit sometimes takes more than one try. You can reach out to a different provider at any time, with no fees or awkward explanations needed. Fit matters more than anything, so we make it easy to keep looking.",
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
      "No — PsychMind is a directory that helps you find and contact independent, verified providers. Your care, scheduling and payments are arranged directly between you and the provider you choose.",
  },
  {
    question: "What if I need help right now?",
    answer:
      "If you're in crisis or thinking about harming yourself, call or text 988 to reach the Suicide & Crisis Lifeline, available 24/7. In an emergency, call 911. PsychMind isn't designed for urgent or emergency care.",
  },
];
