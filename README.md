# Portfolio CMS

A fully dynamic, CMS-driven developer portfolio.

- **Public site** — dark-first, animated, responsive from 360 px phones to 4K. Hero with typing roles, About, Skills, Projects (modal + shareable pages), Journey timeline, Contact form, live GitHub contribution graph, light/dark theme and a visitor accent-colour picker.
- **Admin dashboard** at `/admin` — manage *everything* (profile, photo, projects and galleries, skills, experience/education/certificates, socials, section order and visibility, theme colours, fonts, SEO, resume, messages) **without touching code**.
- Changes appear on the public site within seconds: the API tells the site to revalidate its cache after every edit — no redeploy.

## Live

| | URL |
|---|---|
| **Website** | https://portfolio-cms-ashy.vercel.app |
| **Admin dashboard** | https://portfolio-cms-ashy.vercel.app/admin/login |
| **API** (health check) | https://portfolio-api-59yk.onrender.com/api/v1/health |

The site runs on Vercel, the API on Render (free plan: it sleeps when idle, so the first admin action after a quiet period can take 30–60 seconds) and the data in Prisma Postgres.

```
pnpm install  →  pnpm db:migrate  →  pnpm db:seed  →  pnpm dev
```

---

## Contents

1. [Architecture](#architecture)
2. [Run it locally](#run-it-locally)
3. [Environment variables](#environment-variables)
4. [Using the admin dashboard](#using-the-admin-dashboard)
5. [Scripts](#scripts)
6. [Testing and quality](#testing-and-quality)
7. [Deploying to production](#deploying-to-production)
8. [Security notes](#security-notes)
9. [Troubleshooting](#troubleshooting)
10. [Known limitations](#known-limitations)

---

## Architecture

```mermaid
flowchart LR
  V([Visitor browser])
  O([Owner browser])

  subgraph Vercel
    W["Next.js 15 (apps/web)<br/>Server Components + /admin UI<br/>middleware guards /admin"]
  end
  subgraph Render["Render / Railway / Docker"]
    A["Express API (apps/api)<br/>routes → controllers → services → Prisma"]
  end

  DB[(PostgreSQL<br/>Neon)]
  C[(Cloudinary<br/>images + resume PDF)]
  G[GitHub GraphQL]
  M[SMTP]

  V -->|HTML, cached data| W
  O -->|/admin, /api/v1/* same origin| W
  W -->|SSR fetch with cache tags| A
  W -.->|rewrite /api/v1/* so cookies stay first-party| A
  A --> DB
  A -->|signed server-side uploads / deletes| C
  A -->|contribution calendar, 6 h cache| G
  A -->|new contact message| M
  A -.->|POST /api/revalidate + secret| W
```

**Why the browser only talks to the web origin.** `/api/v1/*` is rewritten by Next.js to the API. Auth cookies (`httpOnly`, `sameSite=strict`, `secure` in production) therefore belong to the *web* domain, so login works across Vercel + Render without third-party-cookie problems, and CSRF is closed by `sameSite=strict` plus an `Origin` check in the API.

**How an edit reaches the site**

```mermaid
sequenceDiagram
  participant Admin as Admin UI (browser)
  participant API as Express API
  participant DB as PostgreSQL
  participant CDN as Cloudinary
  participant Web as Next.js
  participant Visitor

  Admin->>API: PATCH /admin/projects/:id (cookie)
  API->>DB: update
  API->>CDN: delete replaced image (if any)
  API-->>Admin: 200 { success, data }
  API->>Web: POST /api/revalidate { secret, tags: [home, projects, project:slug] }
  Web->>Web: revalidateTag(...) purges cached API data
  Visitor->>Web: GET /
  Web->>API: fetch /public/home (cache miss, tagged)
  Web-->>Visitor: fresh HTML
```

### Repository layout

```
apps/
  api/            Express 5 + TypeScript + Prisma — REST API under /api/v1
    prisma/       schema.prisma, migrations/, seed.ts
    src/          routes → controllers → services → lib (cloudinary, jwt, mailer, …)
    tests/        Vitest + Supertest
  web/            Next.js 15 App Router + Tailwind v4
    src/app/      (site)/ public pages · admin/ dashboard · api/revalidate
    src/components/{site,admin,ui}
    e2e/          Playwright (admin, public site, accessibility)
packages/
  shared/         Zod schemas + TypeScript types used by BOTH apps
```

---

## Run it locally

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 or newer (22 recommended) | |
| pnpm | 11 | `corepack enable` picks the version from `package.json` |
| PostgreSQL | 14+ | easiest: Docker (below), or a free [Neon](https://neon.tech) database |
| Cloudinary account | free tier | only needed to *upload* images; the seeded site renders without it |

### 1. Install

```bash
pnpm install
```

### 2. Start a database

**Option A — Docker (local):**

```bash
docker compose up -d
```

Port 5432 already used by another Postgres on your machine? Pick another port:

```bash
POSTGRES_PORT=5433 docker compose up -d      # then use :5433 in DATABASE_URL below
```

**Option B — hosted (Neon, Prisma Postgres, Supabase…):** create a database and copy its **direct** (non-pooled) connection string.

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` — the values that **must** be set:

```bash
DATABASE_URL=postgresql://portfolio:portfolio@localhost:5432/portfolio?schema=public
JWT_ACCESS_SECRET=<paste output of: openssl rand -base64 48>
JWT_REFRESH_SECRET=<a different output of the same command>
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<at least 10 characters>
WEB_ORIGIN=http://localhost:3000
REVALIDATE_SECRET=<any random string, 16+ chars>
CLOUDINARY_CLOUD_NAME=…      # for image/PDF uploads
CLOUDINARY_API_KEY=…
CLOUDINARY_API_SECRET=…
```

Edit `apps/web/.env`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=…            # same cloud name as the API
API_INTERNAL_URL=http://localhost:4000
REVALIDATE_SECRET=<exactly the same value as in apps/api/.env>
```

> The API refuses to boot with a clear message listing every missing or invalid variable, so you cannot start it half-configured.

### 4. Create the tables and the starter content

```bash
pnpm db:migrate     # applies the migrations in apps/api/prisma/migrations
pnpm db:seed        # admin user + settings + sections + placeholder profile/skills/projects/timeline
```

`db:seed` is idempotent — running it again never duplicates content or overwrites your edits (it only resets the admin password to `ADMIN_PASSWORD`).

### 5. Run

```bash
pnpm dev
```

| What | URL |
|---|---|
| Public site | http://localhost:3000 |
| Admin login | http://localhost:3000/admin/login |
| API health | http://localhost:4000/api/v1/health |

Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then **Account → change your password**.

---

## Environment variables

### `apps/api/.env`

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (use the direct, non-pooled one on Neon) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | ✅ | ≥ 32 chars each, must differ (`openssl rand -base64 48`) |
| `WEB_ORIGIN` | ✅ | Public site origin, no trailing slash. CORS allow-list **and** target of revalidation calls |
| `REVALIDATE_SECRET` | ✅ | Shared secret with the web app (≥ 16 chars) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | ✅ | All uploads and deletions happen server-side with these |
| `ADMIN_EMAIL` | ✅ | Admin login; also the fallback recipient of contact-form emails |
| `ADMIN_PASSWORD` | seed only | Read only by `pnpm db:seed`. Remove it from the server after the first seed |
| `GITHUB_TOKEN` | optional | Enables the contribution graph (a classic token with `read:user` is enough). Never sent to the browser |
| `RESEND_API_KEY`, `MAIL_FROM` | optional | Emails you via the [Resend](https://resend.com) HTTPS API when someone uses the contact form. **Use this on Render**: its free plan blocks outbound SMTP. Default sender is `onboarding@resend.dev`, which can only email your own Resend account address |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | optional | Alternative to Resend (e.g. Gmail app password); used only when `RESEND_API_KEY` is empty. Without either, messages are still stored |
| `TRUST_PROXY_HOPS` | optional | Proxies in front of the API: `1` locally, `2` for Vercel → Render. Controls real client IPs (rate limits, stored message IPs) |
| `PORT`, `NODE_ENV`, `LOG_LEVEL` | optional | defaults `4000`, `development`, `info` |

### `apps/web/.env`

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, sitemap, Open Graph |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Used by the `next/image` Cloudinary loader (public, not secret) |
| `API_INTERNAL_URL` | URL of the Express API. Server-only. Also the target of the `/api/v1/*` rewrite — **baked in at build time**, so redeploy after changing it |
| `REVALIDATE_SECRET` | Must equal the API's value |

> The original brief mentioned `NEXT_PUBLIC_API_URL`. It is intentionally **not used**: the browser never calls the API directly (see [Architecture](#architecture)), so the API URL stays a server-side secret-free setting.

---

## Using the admin dashboard

Open `/admin`. Everything saves to the database and goes live within seconds.

| I want to… | Go to | Notes |
|---|---|---|
| Change my name, photo, bio, typing roles, contact info, resume | **Profile** | Photo is cropped to a square before upload. Resume is a PDF (≤ 10 MB). |
| Add a project | **Projects → New project** | Title auto-fills the slug. Add a cover (16:9), rich-text description, features, tech stack, links, gallery images (drag to reorder, add alt text). Flip **Published** and **Featured** to show it on the homepage. A live card preview is on the right. |
| Hide a project without deleting it | **Projects** | Click its status badge to toggle Draft/Published. |
| Reorder projects, skills, timeline, socials | any list | Drag the ⋮⋮ handle — or focus it, press <kbd>Space</kbd>, move with arrow keys. |
| Add or edit a skill | **Skills** | Pick the category tab, then **Add skill**. Search the icon library, choose level and percentage. |
| Add a job, degree or certificate | **Journey** | Tick **“I currently work here”** to show *Present*. Certificates take an image and credential link. |
| Rename, hide or reorder homepage sections | **Sections** | Hidden sections disappear from the page *and* the navbar. |
| Change colours, fonts, SEO, footer | **Site settings** | Live preview of the palette. Share image should be about 1200×630. |
| Read contact messages | **Messages** | Reply by email, mark read/unread, bulk delete. The sidebar shows the unread count. |
| Change my password | **Account** | |

Replacing or deleting an image also deletes the old file from Cloudinary.

---

## Scripts

Run from the repository root.

| Command | What it does |
|---|---|
| `pnpm dev` | API (`:4000`) and web (`:3000`) with hot reload |
| `pnpm build` / `pnpm start` | Production build / start of both apps |
| `pnpm db:migrate` | `prisma migrate dev` — apply migrations (and create new ones while developing) |
| `pnpm db:deploy` | `prisma migrate deploy` — apply migrations in production, never prompts |
| `pnpm db:seed` | Create admin + starter content (idempotent) |
| `pnpm db:studio` | Browse the database in Prisma Studio |
| `pnpm typecheck` · `pnpm lint` | Strict TypeScript and ESLint across all packages |
| `pnpm test` | API unit/integration tests (Vitest + Supertest, no database needed) |
| `pnpm test:e2e` | Playwright end-to-end + accessibility suite (needs API + web running, see below) |

---

## Testing and quality

- **API tests** (`pnpm --filter @portfolio/api test`, 33 tests): auth and cookies, refresh-token rotation and reuse detection, rate limits, CRUD and Cloudinary clean-up, upload validation by magic bytes, contact form and honeypot. Prisma, Cloudinary and SMTP are mocked, so they run anywhere.
- **End-to-end** (`pnpm test:e2e`, 32 tests): admin login, token refresh, creating a project that then appears on the homepage, every public section, keyboard use, responsive overflow from 360 px to 4K, SEO and a real 404 — plus **axe WCAG 2.1 AA audits** of the public site (dark and light) and all 12 admin pages. Uploads are stubbed, so Cloudinary is not required.

  ```bash
  # terminal 1: database + API + web, built and running (see "Run it locally", then:)
  pnpm build && pnpm start
  # terminal 2:
  pnpm test:e2e
  ```

  It drives your installed Google Chrome. One test enters a wrong password; after five failed logins within 15 minutes the login limiter blocks further logins until the API restarts.
- **Lighthouse** (measured on a production build): desktop 100/100/100/100. Mobile (simulated slow 4G, 4× CPU): Accessibility, Best Practices and SEO 100; Performance 93–96 depending on image size. Re-measure after deploying with your real Cloudinary images.
- **CI**: `.github/workflows/ci.yml` runs typecheck, lint, API tests, build and the full E2E suite against a Postgres service on every push and PR.

---

## Deploying to production

Recommended stack: **Neon** (database) · **Cloudinary** (files) · **Render** or **Railway** (API) · **Vercel** (web). Do the steps in this order, because each one produces a value the next needs.

### 1. Database — Neon

1. Create a project and database. Copy the **direct** connection string (not the “pooled” one) → this is `DATABASE_URL`.

### 2. Files — Cloudinary

1. Note the **Cloud name**, **API key** and **API secret** (Console → Settings → API Keys).
2. If your Cloudinary account blocks PDF delivery, enable *Settings → Security → “Allow delivery of PDF and ZIP files”* so the resume link works.

### 3. API — Render (blueprint included)

1. Push this repository to GitHub.
2. Render → **New → Blueprint** → select the repo. It reads [`render.yaml`](render.yaml). If this folder is not the repo root, set `rootDir` in that file.
3. Fill the prompted values: `DATABASE_URL`, `WEB_ORIGIN` (your final site URL, e.g. `https://yourname.dev`), `REVALIDATE_SECRET` (any random string — remember it), `ADMIN_EMAIL`, `ADMIN_PASSWORD` and the three Cloudinary values. (Render requires a value for every prompted key, so `GITHUB_TOKEN` and the `SMTP_*` settings are not prompted; add them later under *Environment* if you want them.) JWT secrets are generated for you; `TRUST_PROXY_HOPS=2` is preset.
4. The build command applies migrations (`prisma migrate deploy`). Health check: `/api/v1/health`.
5. Copy the service URL, e.g. `https://portfolio-api.onrender.com`.

**Railway / Fly / any Docker host instead:** build the image from the repository root and set the same variables.

```bash
docker build -f apps/api/Dockerfile -t portfolio-api .
docker run -p 4000:4000 --env-file apps/api/.env portfolio-api   # runs migrations, then starts
```

### 4. Web — Vercel

1. **Add New → Project**, import the repo, and set **Root Directory** to `apps/web` (keep *“Include source files outside of the Root Directory”* enabled). [`apps/web/vercel.json`](apps/web/vercel.json) sets the install command.
2. Add environment variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | your final URL, e.g. `https://yourname.dev` |
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | your cloud name |
   | `API_INTERNAL_URL` | the API URL from step 3 (no trailing slash) |
   | `REVALIDATE_SECRET` | **identical** to the API's |

3. Deploy. Attach your domain, then make sure `WEB_ORIGIN` on the API equals that exact origin and redeploy the API if you changed it.

### 5. First run

1. Seed the starter content **once** (creates the admin user and placeholder content). From your machine, pointing at the production database:

   ```bash
   DATABASE_URL="<production url>" ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='<strong password>' \
     pnpm --filter @portfolio/api db:seed
   ```

   (Or use Render’s *Shell* tab: `pnpm --filter @portfolio/api db:seed`.)
2. Open `https://your-site/admin/login`, sign in, **change the password**, then replace the placeholder content.
3. Remove `ADMIN_PASSWORD` from the API’s environment — it is only needed by the seed.
4. Send yourself a test message from the contact form and check the stored IP is *yours* (Messages → open it). If it shows your host’s IP instead, adjust `TRUST_PROXY_HOPS`.

### Production checklist

- [ ] `WEB_ORIGIN` equals the site origin exactly (scheme + host, no trailing slash)
- [ ] `REVALIDATE_SECRET` identical on API and web; edit something in admin and confirm the public site updates
- [ ] `API_INTERNAL_URL` set **before** the Vercel build (the rewrite is compiled in)
- [ ] Default admin password changed; `ADMIN_PASSWORD` removed from the server
- [ ] `GITHUB_TOKEN` set and a GitHub username saved in Profile (otherwise the activity section shows an “unavailable” note)
- [ ] SMTP configured, or you check **Messages** regularly
- [ ] Re-run Lighthouse against the live URL

> **Render free tier** sleeps after inactivity, so the first API call can take ~30–60 s. Public pages are served from Next’s cache and stay fast; only the first admin action or an uncached render is slow.

---

## Security notes

- Passwords hashed with bcrypt (12 rounds). Access token 15 min, refresh token 7 days, both in `httpOnly`, `sameSite=strict`, `secure` (production) cookies. Refresh tokens rotate on every use and are stored **hashed**; presenting an old token revokes the session.
- Login limited to 5 failures per 15 minutes, contact form to 5 per hour per IP, plus a honeypot field.
- Every request body and query is validated with Zod schemas shared by both apps; rich text is sanitised on the server (`sanitize-html`).
- Uploads are validated by **magic bytes**, not file extension; SVG is rejected; images ≤ 5 MB, PDFs ≤ 10 MB. Cloudinary credentials never leave the API.
- `helmet`, a CORS allow-list, an `Origin` check on state-changing requests, and security headers on the web app. No secrets in client bundles; `passwordHash` and `refreshToken` are never returned.
- Not included: a Content-Security-Policy on the web app (it needs per-request nonces for the inline theme and JSON-LD scripts). Worth adding if you want to go further.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| API exits immediately with `Invalid environment variables` | The message lists each bad variable. Fix `apps/api/.env`. |
| `P1001 Can't reach database server` | Wrong host/port in `DATABASE_URL`, or the container is not up (`docker compose ps`). Port 5432 busy → `POSTGRES_PORT=5433`. |
| Public site shows an error page / `Site is not set up yet` | Run `pnpm db:seed`. |
| `/admin` loops back to the login page | `API_INTERNAL_URL` wrong or the API is down; check `…/api/v1/health`. |
| “Too many login attempts” | 5 failed logins in 15 min. Wait, or restart the API (the limiter is in memory). |
| Edits in admin don’t appear on the site | `REVALIDATE_SECRET` differs between apps, or `WEB_ORIGIN` is wrong. The API logs `Revalidation rejected`. |
| Contact messages arrive in **Messages** but no email | Render's free plan blocks SMTP. Set `RESEND_API_KEY` instead (see the env table). Check the API logs for `Failed to send contact notification`. |
| Render build fails with `P1002 … advisory lock` at `prisma migrate deploy` | Pooled databases (Prisma Postgres, PgBouncer) cannot take Prisma's migration lock. Add the environment variable `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1` to the service (it is preset in `render.yaml`). |
| Image upload fails with 502 | Cloudinary credentials are the demo values. Set real ones. |
| Contact messages all show the same IP | `TRUST_PROXY_HOPS` too low for your proxy chain. |
| `pnpm install` warns about ignored build scripts | Allowed builds are listed in `pnpm-workspace.yaml`; run `pnpm approve-builds` if you add native packages. |
| E2E: login test fails after several runs | Login limiter (see above) — restart the API. |

---

## Known limitations

- Real Cloudinary uploads/deletions, SMTP delivery and the GitHub token path are covered by code but not by automated tests (uploads are stubbed in E2E).
- Single admin user and one active session at a time (logging in elsewhere ends the previous session once its 15-minute access token expires).
- Mobile Lighthouse Performance depends on your image sizes; large unoptimised cover images lower it.
- The login/contact rate limiters are in-memory: they reset on restart and are per instance (run one API instance, or move them to Redis).
