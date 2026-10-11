# Registering PsychMind's DMCA agent

Providers upload photos and write profile text, so PsychMind hosts user content. The DMCA safe harbor (17 U.S.C. § 512(c)) protects us from copyright claims over that content, but only if **both** of these are true:

1. A designated agent is registered with the U.S. Copyright Office.
2. The same agent details are published on our site.

The second part is built: `/copyright` shows the agent from the `DMCA_AGENT_*` variables, and it's linked in the footer. This guide covers the first part. It takes about 15 minutes and costs **$6**.

Sources: [DMCA Designated Agent Directory](https://www.copyright.gov/dmca-directory/), [its FAQ](https://www.copyright.gov/dmca-directory/faq.html), and 37 C.F.R. § 201.38.

## Before you start, decide

- **The service provider:** the company's **full legal name**, exactly as registered with the state (an LLC or Inc., not just "PsychMind").
  - If the company isn't formed yet, form it first. The registration has to name the legal entity that runs the site.
- **A physical street address for the company.** A PO box isn't accepted here without the Office's advance written approval.
- **The agent:** who receives notices. This can be a person, a role ("Copyright Agent"), a department or an outside firm. A role survives staff changes, so it's the better choice.
  - The agent needs a mailing address (a PO box is fine), a phone number and an email address.
  - Use a shared inbox such as `copyright@psychmind.org`, not a personal address.
- **Alternate names:** every name people might search for: `PsychMind`, `psychmind.org`, `www.psychmind.org` and `app.psychmind.org`.

## Register

1. Go to **https://dmca.copyright.gov/osp/login.html** and create an account.
   - You'll be the primary contact. Add a secondary contact so renewal reminders don't depend on one inbox.
2. Choose **Designate an agent** and enter the service provider details: legal name, street address and alternate names.
3. Enter the agent details: name or role, organization, address, phone and email.
4. Review the details, then pay the **$6** fee online.
5. Save the confirmation. Note the **registration number** shown in the directory (format `DMCA-10xxxxx`).
6. Search for "PsychMind" at **https://dmca.copyright.gov/osp/** and check the listing is public.

## Publish it on the site

Set these in Vercel (Project → Settings → Environment Variables, Production), using the same values you registered:

```
LEGAL_COMPANY_NAME=PsychMind, LLC
DMCA_AGENT_NAME=Copyright Agent
DMCA_AGENT_ADDRESS=123 Main St, Suite 4, Miami, FL 33101
DMCA_AGENT_EMAIL=copyright@psychmind.org
DMCA_AGENT_PHONE=+1 305 555 0100
DMCA_AGENT_REGISTRATION=DMCA-1012345
```

`/copyright` is pre-rendered, so **redeploy** afterwards. Then:

- open `/copyright` and check that section 3 shows the agent;
- check that `/dev/setup` (on a preview) shows **DMCA agent: Registered**.

## Keep it valid

- **It expires after 3 years.** The Office emails reminders at 90, 60, 30 and 7 days before. Renewing (an amendment or resubmission, $6) starts a new 3-year period.
  - A lapsed designation is invalid, and the safe harbor goes with it.
  - Put the renewal date in the team calendar.
- **Any change to the agent, address or company name** means amending the registration ($6), updating the variables and redeploying.
- **When a notice arrives:**
  1. Check it has the six elements listed on `/copyright`.
  2. Remove or hide the material quickly. Today the tool for this is **Suspend** on the provider's review page in Admin, which takes the whole profile out of search. There's no "remove just this photo" button yet.
  3. Tell the provider and send them a copy of the notice.
  4. Log what you did.
  5. If they counter-notify, wait 10–14 business days, then restore the material unless the claimant tells you they've gone to court.
- **Repeat infringers:** suspend, and in appropriate cases close, accounts with repeated valid notices. `/copyright` promises this, and the safe harbor requires us to actually do it.

The `/copyright` text is new copy, written to § 512's requirements. Have counsel review it before launch.
