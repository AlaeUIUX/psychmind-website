# To do

Owner requests and known gaps that aren't scheduled yet. Newest first within
each section. The slice plan lives in `build-plan/BUILD-PLAN.md`.

## Next

- **Bring the dashboards up to the new portal design**: provider dashboard,
  admin console and patient account. Use the approved caliber: zinc, blue
  accent, `type-ui-*`, paper surfaces.

## Later

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
