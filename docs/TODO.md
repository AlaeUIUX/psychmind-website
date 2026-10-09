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
- **Privacy policy: mention the in-house analytics** (client copy). What's
  collected: daily counts of page views, searches and profile views; search
  terms built only from filters; a daily visitor count from a hash of IP and
  browser that's deleted at the end of each day. No cookies, no third
  parties, and browsers that send Do Not Track or Global Privacy Control
  aren't counted as visitors.
- **Analytics copy to confirm with the client.** Figma D1's footnotes are shown
  verbatim: "Search results are updated everyday" ("every day") and "This
  visual helps optimizing for keywords" ("helps you optimize"). New copy
  (metric definitions, empty states, the admin console) is marked
  `TODO(client)`.

## Later

- **Analytics: what's left** (slice 11 shipped its first version).
  - **Data retention** (D23): daily counts are kept; search terms go after a
    year and visitor hashes after a day. Revisit if the client wants less.
  - **Funnels and sources** (which page or link brought a visitor) would need
    the referrer; left out on purpose until there's a privacy decision.
  - **Exports** (CSV) for providers and admins.

- **Search: what's left after the first version** (slice 8). Filters, counts,
  close matches, the quick look and the phone drawer work.
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
- **Saving while a license is still uploading** shows "document required"
  until the upload lands, then clears. Better: disable "Save and continue"
  (or wait) while an upload is in progress.
- **Delete uploads that are never saved.** A photo or license uploaded during
  onboarding but never saved stays in storage. Needs a scheduled cleanup job.
- **Google sign-in in production.** The code is ready (`docs/live-testing.md`).
  It needs the Google client's production URLs and the consent screen
  published.
