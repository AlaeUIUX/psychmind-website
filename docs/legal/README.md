# Legal safeguards

This is an engineering checklist for six legal risks, as they stood on 2026-10-11. It is not legal advice. Have counsel review the new copy (the age screen, renewal terms, the copyright policy and the email footers) before launch.

| # | Risk | Where it stood | What's in place now |
|---|---|---|---|
| 1 | **COPPA / minors:** sign-up never asked for age (Terms §3 says 18+) | No age question. The public `/api/auth/sign-up/email` endpoint would also take any sign-up. | A neutral date-of-birth screen on sign-up. Under-18s are turned away, and the screen stays closed on that browser for a day. The endpoint enforces it too. Google sign-up needs the same check first. Only `age_confirmed_at` is stored, never the date. |
| 2 | **GDPR / third-party IP leaks** (the Munich Google Fonts ruling) | Fonts were already self-hosted: `next/font` downloads them at build, and the CSP has `font-src 'self'`. But sample-provider photos were hotlinked from Unsplash. | Photos are served through our own `/_next/image` (`lib/photos.ts selfHosted`). The CSP `img-src` allows no third-party hosts, and a unit test fails if Google Fonts URLs appear. |
| 3 | **Session replay / wiretapping (CIPA)** | None installed. Analytics are in-house, cookie-less counts with no keystrokes, and the CSP's `connect-src 'self'` blocks outside collectors. | A unit test fails if a replay or third-party analytics SDK is added. If one is ever wanted: consent first, mask every input, and marketing pages only (`docs/build-plan/research/architecture.md`). |
| 4 | **CAN-SPAM** | No marketing email exists yet. Every email is transactional, and the footers had no postal address. | Every email shows `LEGAL_POSTAL_ADDRESS` once it's set. `server/marketing.ts` is the only way to send marketing email: it refuses without the address, adds a visible unsubscribe link plus one-click `List-Unsubscribe` headers, and skips opted-out addresses. |
| 5 | **Automatic renewal law (California ARL)** | The renewal note sat in a side panel, there was no consent, and Stripe Checkout showed no terms. | The full terms (real Stripe price, interval, how to cancel) sit right beside "Activate your listing", with their own required checkbox. Consent is audit-logged with the terms version. The terms repeat above Stripe's Subscribe button, and an acknowledgment email follows checkout. |
| 6 | **DMCA safe harbor** | No agent and no policy. | A public `/copyright` page (notice, counter-notice and repeat-infringer policy), linked in the footer, showing `DMCA_AGENT_*`. Registering the agent ($6) is manual: see [dmca-agent.md](dmca-agent.md). |

## Still to do, by a person

These are tracked on `/dev/progress`: the client items under "Client and business", and the Stripe setting in the Stripe group.

- [ ] **Set `LEGAL_POSTAL_ADDRESS`** on Vercel. It must be a real address: a street address, a USPS PO box or a registered commercial mailbox.
- [ ] **Register the DMCA agent** and set `DMCA_AGENT_*` ([dmca-agent.md](dmca-agent.md)). Renew every 3 years.
- [ ] **Configure the Stripe Customer Portal** so cancellation works online and takes effect **at the end of the billing period**. The renewal terms promise this. (Dashboard → Settings → Billing → Customer portal → Cancellations.)
- [ ] **Approve the new copy** (`TODO(client)` comments): the age screen, the under-18 page, the renewal terms and checkbox, the unsubscribe page, `/copyright`, and the email footer lines.
- [ ] **Fix the Cookie policy.** It promises a consent banner and a "cookie settings" footer link, and neither exists. The site sets no non-essential cookies, so the simplest fix is changing the text.

## Where it lives

- Age screen: `lib/age.ts`, `server/auth/age.ts`, the hooks in `server/auth/index.ts`, `components/auth/age-blocked.tsx`, and `BirthDateField` in `components/auth/fields.tsx`.
- Third-party requests: `lib/csp.ts` and `lib/photos.ts`.
- Email: `server/emails.ts` (footer), `server/marketing.ts`, `/unsubscribe/[token]`, `/api/unsubscribe/[token]`, and the `email_preference` table.
- Renewal: `lib/billing.ts` (`renewalTerms`, `RENEWAL_TERMS_VERSION`), `server/billing/price.ts`, `server/billing/actions.ts`, and `getCheckoutSessionParams` in `server/auth/index.ts`.
- DMCA: `app/(site)/copyright`, `lib/legal.ts`, and [dmca-agent.md](dmca-agent.md).
- Tests: `tests/unit/legal-safeguards.test.ts` and `tests/e2e/legal-safeguards.spec.ts`.

## Decisions

- **Guest session requests stay without an age question** (owner, 2026-10-11). They collect a name and email, which is normal for a general-audience site with no knowledge of minors. The 18+ screen guards account creation.
