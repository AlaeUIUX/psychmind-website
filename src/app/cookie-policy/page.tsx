import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Cookie policy — PsychMind",
  description: "How PsychMind uses cookies, and the choices you have.",
};

const mailLink = (
  <a href="mailto:hello@psychmind.co" className="underline hover:text-warm-900 transition-colors">
    hello@psychmind.co
  </a>
);

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie policy"
      lastUpdated="March 2026"
      crossLinks={[
        { label: "PRIVACY POLICY", href: "/privacy-policy" },
        { label: "TERMS AND CONDITIONS", href: "/terms" },
      ]}
      sections={[
        {
          heading: "1. What are cookies",
          paragraphs: [
            "Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how you use it.",
          ],
        },
        {
          heading: "2. What we use cookies for",
          paragraphs: [
            "Strictly necessary cookies: These keep you logged in and make the platform function. You cannot opt out of these without stopping use of the platform.",
            "Functional cookies: These remember your preferences — such as your search filters or language settings — so you do not have to re-enter them each visit.",
            "Analytics cookies: These help us understand how people use PsychMind — which pages are visited most, where people drop off, and how we can improve the experience. We use anonymized, aggregated data only. We do not use Google Analytics or any third-party ad tracking.",
            "We do not use advertising or targeting cookies. Ever.",
          ],
        },
        {
          heading: "3. Your choices",
          paragraphs: [
            "When you first visit PsychMind you will be asked to accept or decline non-essential cookies. You can change your preferences at any time from the cookie settings link in the footer. You can also control cookies through your browser settings — most browsers allow you to block or delete cookies entirely.",
            "Note that blocking strictly necessary cookies will affect your ability to use the platform.",
          ],
        },
        {
          heading: "4. Third-party cookies",
          paragraphs: [
            "If we embed third-party content (such as a video or map), those providers may set their own cookies. We have no control over these and recommend reviewing their respective privacy policies.",
          ],
        },
        {
          heading: "5. Changes to this policy",
          paragraphs: [
            "We may update this policy as we add or remove tools. The date at the top reflects the latest version.",
          ],
        },
        {
          heading: "6. Contact",
          paragraphs: [<>Cookie questions? {mailLink}.</>],
        },
      ]}
    />
  );
}
