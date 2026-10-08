# To do

Owner requests and known gaps that aren't scheduled yet. Newest first within
each section. The slice plan lives in `build-plan/BUILD-PLAN.md`.

## Next

- **Session requests** (the owner will send the details). "Request a session"
  opens a placeholder dialog that offers Save for now. Requests should work
  as a guest or with an account; Figma B1–B7 has the wizard.
- **Remove the sample providers before real providers launch** (Admin → All
  providers → Remove samples). They're labelled and can't be booked, but they
  shouldn't sit next to real providers for long.
- **Bring the dashboards up to the new portal design**: provider dashboard,
  admin console and patient account. Use the approved caliber: zinc, blue
  accent, `type-ui-*`, paper surfaces.

## Later

- **Search engine and filters** (slice 8). `/providers` lists everyone for
  now; the landing page search isn't wired up yet, on purpose.
- **Saved providers who leave the directory** should stay on the patient's
  list, labelled as unavailable (plan, slice 9). Today they drop off.
- **"Something wrong with this profile?"** links to the contact form. A proper
  report flow (reason, provider id, admin queue) would be better.
- **Custom tags report for admins** (owner request, 2026-10-08).
  - Providers can add their own specialties and approaches. These are saved on
    their profile (`provider_profile.specialties` / `approaches`), so nothing
    is lost.
  - Add an admin view listing the custom tags with how many providers use
    each, so popular ones can be promoted to the standard list in
    `lib/taxonomy.ts`.
- **Admin accounts without sign-up** (owner request, 2026-10-08)
  - Admins are still added manually through `ADMIN_EMAILS`, but their accounts
    are created for them; nobody signs up as an admin.
  - A separate admin log-in page at `psychmind.org/admin`.
  - A new admin gets an email with a temporary password. On first log-in
    they must change it and set up an authenticator before anything else.
  - Every admin log-in after that is password plus authenticator code.
  - Today an admin signs up like anyone else, then is made admin at sign-in
    because their email is listed. It works, but it's confusing the first time.
- **Delete uploads that are never saved.** A photo or license uploaded during
  onboarding but never saved stays in storage. Needs a scheduled cleanup job.
- **Google sign-in in production.** The code is ready (`docs/live-testing.md`).
  It needs the Google client's production URLs and the consent screen
  published.
