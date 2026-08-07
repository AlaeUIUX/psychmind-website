import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms & conditions — PsychMind",
  description: "The terms that govern your use of PsychMind.",
};

const mailLink = (
  <a href="mailto:hello@psychmind.co" className="underline hover:text-warm-900 transition-colors">
    hello@psychmind.co
  </a>
);

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & conditions"
      lastUpdated="March 2026"
      crossLinks={[
        { label: "PRIVACY POLICY", href: "/privacy-policy" },
        { label: "COOKIE POLICY", href: "/cookie-policy" },
      ]}
      sections={[
        {
          heading: "1. Who we are",
          paragraphs: [
            "PsychMind is an online platform that connects individuals seeking mental health support with verified independent providers and psychologists. We are not a medical provider, a clinic, or a therapy service. We are a directory and request platform.",
          ],
        },
        {
          heading: "2. Accepting these terms",
          paragraphs: [
            "By creating an account or using PsychMind in any way, you agree to these terms. If you do not agree, please do not use the platform.",
          ],
        },
        {
          heading: "3. Who can use PsychMind",
          paragraphs: [
            "You must be at least 18 years old to create an account on PsychMind. By registering, you confirm that you meet this requirement. If you are under 18, please ask a parent or legal guardian to assist you.",
          ],
        },
        {
          heading: "4. What PsychMind is — and is not",
          paragraphs: [
            "PsychMind provides a search and request interface. We do not provide therapy, psychological treatment, or medical advice. We are not responsible for the content of sessions between users and providers, nor for any therapeutic outcomes. In case of a mental health emergency, please contact your local emergency services immediately.",
          ],
        },
        {
          heading: "5. Provider accounts",
          paragraphs: [
            "Providers and psychologists who register as providers confirm that they hold valid, current licenses or qualifications to practice in their jurisdiction. PsychMind manually reviews provider credentials before approving profiles, but this review does not constitute endorsement or guarantee of therapeutic outcomes.",
          ],
        },
        {
          heading: "6. Your account",
          paragraphs: [
            "Providers and psychologists who register as providers confirm that they hold valid, current licenses or qualifications to practice in their jurisdiction. PsychMind manually reviews provider credentials before approving profiles, but this review does not constitute endorsement or guarantee of therapeutic outcomes.",
          ],
        },
        {
          heading: "7. Payments and cancellations",
          paragraphs: [
            "Session fees are set by individual providers and displayed on their profiles. PsychMind may facilitate payment processing but is not party to the financial agreement between patient and provider. Cancellation and refund policies are determined by each provider individually and will be communicated at time of request.",
          ],
        },
        {
          heading: "8. Prohibited conduct",
          paragraphs: [
            "You agree not to: use the platform for any unlawful purpose; impersonate any person or entity; post false, misleading, or fraudulent information; attempt to access another user's account; use automated tools to scrape or interact with the platform; harass, abuse, or harm any other user or provider.",
          ],
        },
        {
          heading: "9. Intellectual property",
          paragraphs: [
            "All content on PsychMind — including the name, logo, illustrations, copy, and platform design — is owned by PsychMind and may not be reproduced without written permission.",
          ],
        },
        {
          heading: "10. Limitation of liability",
          paragraphs: [
            "To the fullest extent permitted by applicable law, PsychMind shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you paid to use the platform in the three months preceding the claim.",
          ],
        },
        {
          heading: "11. Changes to these terms",
          paragraphs: [
            "We may update these terms from time to time. We will notify registered users by email of any material changes. Continued use of the platform after changes take effect constitutes acceptance of the new terms.",
          ],
        },
        {
          heading: "12. Governing law",
          paragraphs: [
            "These terms shall be governed by applicable law in the jurisdiction where PsychMind is registered. As jurisdiction is still being established, users agree that any disputes will be resolved through good-faith negotiation first, followed by binding arbitration if necessary.",
          ],
        },
        {
          heading: "13. Contact",
          paragraphs: [<>Questions about these terms? Write to us at {mailLink}.</>],
        },
      ]}
    />
  );
}
