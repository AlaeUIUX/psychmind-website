import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { dmcaAgentConfigured, legalDetails } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Copyright policy — PsychMind",
  description: "How to report content on PsychMind that infringes your copyright, and how to respond to a report.",
};

// The DMCA notice-and-takedown policy. The safe harbor for what providers
// upload (17 U.S.C. § 512(c)) needs a designated agent registered with the
// U.S. Copyright Office AND that agent's details published here; both come
// from DMCA_AGENT_* (lib/legal.ts, guide: docs/legal/dmca-agent.md).
// TODO(client): new copy; have counsel review before launch.

const mailLink = (address: string) => (
  <a href={`mailto:${address}`} className="underline hover:text-warm-900 transition-colors">
    {address}
  </a>
);

function AgentDetails() {
  const { dmcaAgent: a, companyName } = legalDetails();
  if (!dmcaAgentConfigured()) {
    return <>Send notices to {mailLink("hello@psychmind.co")} with the subject line &ldquo;Copyright notice&rdquo;.</>;
  }
  return (
    <span className="flex flex-col gap-1 not-italic" data-testid="dmca-agent">
      <span>Copyright Agent, {companyName}</span>
      <span>Attn: {a.name}</span>
      <span>{a.address}</span>
      <span>Email: {mailLink(a.email!)}</span>
      <span>Phone: {a.phone}</span>
      {a.registration && <span>U.S. Copyright Office registration: {a.registration}</span>}
    </span>
  );
}

export default function CopyrightPage() {
  return (
    <LegalPage
      title="Copyright policy"
      lastUpdated="October 2026"
      crossLinks={[
        { label: "TERMS AND CONDITIONS", href: "/terms" },
        { label: "PRIVACY POLICY", href: "/privacy-policy" },
      ]}
      sections={[
        {
          heading: "1. Our policy",
          paragraphs: [
            "PsychMind respects the intellectual property of others and expects the providers who use it to do the same. Under the Digital Millennium Copyright Act (DMCA), we respond to clear notices of alleged copyright infringement in material that users upload, such as profile photos and profile text, and we remove or disable access to that material when appropriate.",
          ],
        },
        {
          heading: "2. Reporting infringement",
          paragraphs: [
            "If you believe material on PsychMind infringes your copyright, send a written notice to our designated agent (below) that includes:",
            "(a) your physical or electronic signature, as the owner or someone authorized to act for them; (b) a description of the copyrighted work you believe was infringed; (c) the material you believe is infringing and where it is on PsychMind, such as the profile's web address; (d) your name, postal address, telephone number and email address; (e) a statement that you have a good-faith belief that the use is not authorized by the copyright owner, its agent or the law; and (f) a statement that the information in your notice is accurate and, under penalty of perjury, that you are the owner or authorized to act on the owner's behalf.",
            "Notices that leave out these elements may not be acted on. Please don't use this process for other requests; for those, use our Contact page.",
          ],
        },
        {
          heading: "3. Our designated agent",
          paragraphs: [<AgentDetails key="agent" />],
        },
        {
          heading: "4. What happens next",
          paragraphs: [
            "When we receive a complete notice, we remove or disable access to the material promptly, and we tell the user who posted it, with a copy of the notice.",
          ],
        },
        {
          heading: "5. Counter-notification",
          paragraphs: [
            "If your material was removed and you believe that was a mistake or a misidentification, you can send our designated agent a counter-notification that includes: (a) your physical or electronic signature; (b) the material that was removed and where it appeared before; (c) a statement, under penalty of perjury, that you have a good-faith belief it was removed as a result of mistake or misidentification; and (d) your name, address and telephone number, and a statement that you consent to the jurisdiction of the federal district court for your address (or, if you are outside the United States, any judicial district in which PsychMind may be found) and that you will accept service of process from the person who sent the original notice.",
            "We then send your counter-notification to the person who sent the original notice. If they don't tell us within 10 business days that they have filed a court action, we restore the material within 10 to 14 business days of receiving your counter-notification.",
          ],
        },
        {
          heading: "6. Repeat infringers",
          paragraphs: [
            "We suspend, and in appropriate circumstances close, the accounts of users who repeatedly infringe copyrights.",
          ],
        },
        {
          heading: "7. Misrepresentations",
          paragraphs: [
            "Anyone who knowingly misrepresents that material is infringing, or that it was removed by mistake, may be liable for damages, including costs and attorneys' fees (17 U.S.C. § 512(f)).",
          ],
        },
      ]}
    />
  );
}
