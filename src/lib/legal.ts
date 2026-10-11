// Public legal details, set per deployment (they're the company's, not code):
// - LEGAL_POSTAL_ADDRESS: a valid physical postal address (a street address,
//   a USPS PO box or a registered private mailbox). CAN-SPAM requires it in
//   every commercial email; marketing email refuses to send without it.
// - DMCA_AGENT_*: the designated agent exactly as registered with the U.S.
//   Copyright Office (docs/legal/dmca-agent.md). The /copyright page shows it,
//   which the DMCA safe harbor (17 U.S.C. § 512(c)(2)) requires.
// /dev/setup shows which of these a deployment is missing.

const env = (name: string) => process.env[name]?.trim() || null;

export function legalDetails() {
  return {
    companyName: env("LEGAL_COMPANY_NAME") ?? "PsychMind",
    postalAddress: env("LEGAL_POSTAL_ADDRESS"),
    dmcaAgent: {
      name: env("DMCA_AGENT_NAME"),
      address: env("DMCA_AGENT_ADDRESS"),
      email: env("DMCA_AGENT_EMAIL"),
      phone: env("DMCA_AGENT_PHONE"),
      /** The Copyright Office's registration number (DMCA-10xxxxx). */
      registration: env("DMCA_AGENT_REGISTRATION"),
    },
  };
}

/** Whether the DMCA agent details are complete enough to publish. */
export function dmcaAgentConfigured() {
  const { name, address, email, phone } = legalDetails().dmcaAgent;
  return Boolean(name && address && email && phone);
}
