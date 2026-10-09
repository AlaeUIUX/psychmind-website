# To do

Owner requests and known gaps that aren't scheduled yet. Newest first within
each section. The slice plan lives in `build-plan/BUILD-PLAN.md`.

## Next

- **Request copy to confirm with the client** (Figma B6/B7 says things the
  flow doesn't do). "You'll receive a confirmation with the session link and
  a calendar invite": we send a confirmation, but no session link or invite.
  "Most providers respond within 2-3 business days?" has a stray "?" and
  disagrees with "within 48 hours" on the account version. Both are shown
  verbatim until the client decides.
- **Remove the sample providers before real providers launch** (Admin → All
  providers → Remove samples). They're labelled and can't be booked, but they
  shouldn't sit next to real providers for long.
- **Bring the dashboards up to the new portal design**: provider dashboard,
  admin console and patient account. Use the approved caliber: zinc, blue
  accent, `type-ui-*`, paper surfaces.

## Later

- **Search: what's left after the first version** (slice 8). Filters, counts,
  close matches, the quick look and the phone drawer work.
  - **Home page search:** wire it to `/providers` with the same fields. The
    owner asked to hold off on this.
  - **Real distance:** "near" is same ZIP, city, ZIP area, then state. Real
    distance needs a ZIP-coordinates table, or a geocoder for "Use my location".
  - **Insurance filter:** hidden until the insurance decision (D2).
  - **"Session type" filter** (individuals, couples, families, groups) isn't
    in Figma's filters. Add it if the client wants it.
  - **Move the engine into Postgres** once there are thousands of providers.
    It's pure TypeScript, so it can move as is.
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
