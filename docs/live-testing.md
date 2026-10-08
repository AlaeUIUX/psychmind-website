# Testing sign-in live (Google + email)

Two ways to try the real login. Do **A** first (about 10 minutes, all local), then **B** to get a link you can open on any device.

Open **`/dev/setup`** at any point. It shows what's connected and the exact URLs Google needs, and it never shows secret values. It's hidden on the production site.

---

## A. Google sign-in on your machine

### 1. Create the Google OAuth client (free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project, for example "PsychMind".
2. Open **Google Auth Platform**. The first time, it asks you to set the app up:
   - **App name:** PsychMind.
   - **Support email:** your address.
   - **Audience:** **External**.
   - **Contact email:** your address.
3. In **Audience**, keep the status on **Testing**. Under **Test users**, add every Google account that should be able to sign in (yours, Brenda's). While in Testing, only these accounts can sign in.
4. Open **Clients** and choose **Create client**. Pick **Web application** and name it "PsychMind local".
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`
5. Choose **Create**, then copy the **Client ID** and **Client secret**.

> Google only accepts `http://localhost` for local testing, not `app.localhost`. That's why the next step turns the portal subdomain off locally.

### 2. Add the keys to `.env.local`

```bash
GOOGLE_CLIENT_ID=…the client ID
GOOGLE_CLIENT_SECRET=…the client secret
APP_HOST=off
```

`APP_HOST=off` serves the portal from `http://localhost:3000` instead of `http://app.localhost:3000`. Remove the line to get the subdomain back.

### 3. Try it

1. Restart the dev server. Make sure it's on port 3000, since the Google client lists that port.
2. Open `http://localhost:3000/dev/setup`. **Google sign-in** should say **On**.
3. Open `http://localhost:3000/login` and choose **Continue with Google**.

| Start from | Result |
|---|---|
| Log in | A new Google account becomes a **patient** and lands on `/account`. |
| Sign up → Mental health provider | Choosing Google starts **provider onboarding**. |
| Same email as an existing email/password account | The two are linked, because Google verified the email. |
| An address listed in `ADMIN_EMAILS` | Becomes **admin** straight away and goes to `/admin`. |

---

## B. A live preview on Vercel

Each branch you push gets its own private Vercel URL. `main` (psychmind.org) is untouched.

### 1. Free Postgres database

Use **Vercel → your project → Storage → Create Database → Neon** (free tier).

- Connect it to the project for the **Preview** environment only, which keeps the live site out of it.
- Neon sets `DATABASE_URL` for you.

*Or use Supabase:* go to Project → **Connect** → **Transaction pooler**, and paste that URL as `DATABASE_URL`.

Tables are created automatically: every Vercel build runs the migrations first (`npm run build` → `scripts/db-migrate.mjs`).

### 2. Environment variables

Go to **Vercel → Settings → Environment Variables** and set each of these for **Preview** only:

| Variable | Value |
|---|---|
| `BETTER_AUTH_SECRET` | A random string. Run `openssl rand -base64 32`, or use any password generator with 32+ characters. |
| `GOOGLE_CLIENT_ID` | From A.1. The same client is fine; you'll add the preview URL to it in step 4. |
| `GOOGLE_CLIENT_SECRET` | From A.1. |
| `ADMIN_EMAILS` | Your email, so you can open `/admin`. |
| `EMAIL_FROM` | `PsychMind <onboarding@resend.dev>` until psychmind.org is verified in Resend (see the notes). |
| `RESEND_API_KEY` | Probably already set for the contact form. Make sure it also applies to **Preview**. |

**Don't** set `APP_HOST` or `BETTER_AUTH_URL` for Preview. A preview serves everything from one host and uses its branch URL automatically.

### 3. Deploy the branch

Push the `app/foundations` branch; Claude does this once you say so. Vercel builds it in about 2 minutes. The deployment page lists a **branch URL** that stays the same across pushes:

```
https://<project>-git-app-foundations-<team>.vercel.app
```

Always test on the branch URL. Per-deploy URLs send portal pages to it automatically.

### 4. Tell Google about the preview

1. Open `<branch URL>/dev/setup`.
2. Copy the **Authorized JavaScript origin** and **Authorized redirect URI** into your Google client: Clients → PsychMind local → add both, then Save.
3. Wait a few minutes for Google to pick them up.
4. Open `<branch URL>/login` and choose **Continue with Google**.

Previews are behind **Vercel Authentication** by default: only people logged in to your Vercel team can open them. To let someone else test, use **Share** on the deployment, which creates a shareable link.

---

## Notes and troubleshooting

| You see | Fix |
|---|---|
| `Error 400: redirect_uri_mismatch` | The URI in Google must match `/dev/setup` exactly: same `https`, no trailing slash, the branch URL and not a per-deploy one. |
| "Access blocked" or "has not completed verification" | Add that Google account under **Audience → Test users**. |
| Back on log in with "We couldn't sign you in with Google" | Usually the flow switched domains midway. Start again from the branch URL. Vercel → Logs shows the exact reason. |
| Build fails at `[db-migrate]` | `DATABASE_URL` is wrong or unreachable. Copy it again from Neon or Supabase. |
| Email sign-up: the verification email never arrives | With `onboarding@resend.dev`, Resend only delivers to the address that owns the Resend account. Sign up with that address, or verify psychmind.org in Resend. |

**Email for real users.** In Resend, go to **Domains → Add psychmind.org** and add the DNS records it shows at your registrar. Then set `EMAIL_FROM=PsychMind <hello@psychmind.org>`. The sender can be any address on the verified domain.

**Uploads.** Photos and license files are stored privately in Postgres on Vercel (the `file_blob` table, served only through `/api/files/[id]`). That's fine for testing and the first providers. Supabase Storage replaces it later.

**Going to production** (later, with the owner's go-ahead):

1. Add `app.psychmind.org` as a domain in Vercel.
2. Set the **Production** environment variables:
   - `APP_HOST=app.psychmind.org`
   - `BETTER_AUTH_URL=https://app.psychmind.org`
   - its own `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
3. Add `https://app.psychmind.org` and `https://app.psychmind.org/api/auth/callback/google` to the Google client.
4. Set the Google app to **In production**. Sign-in with only name, email and profile picture doesn't need Google's review.
