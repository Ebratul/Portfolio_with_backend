# Portfolio CMS — project memory

A fully dynamic, CMS-driven developer portfolio. A public site (dark-first, animated) plus an admin
dashboard that manages ALL content. Nothing content-related is hard-coded in the frontend.

Monorepo (pnpm workspaces, no Turborepo):

```
apps/api      Express 5 + TypeScript + Prisma (PostgreSQL) — REST API at /api/v1
apps/web      Next.js 15 App Router + Tailwind v4 — public site + /admin UI
packages/shared   Zod schemas, enums, response envelope, shared TS types (source-only, no build)
```

## Commands

```
pnpm install
pnpm db:migrate      # prisma migrate dev (needs a real DATABASE_URL in apps/api/.env)
pnpm db:seed         # admin user + settings + sections + placeholder content (idempotent)
pnpm dev             # api :4000 + web :3000
pnpm -r typecheck | pnpm -r lint | pnpm --filter @portfolio/api test
```

`apps/api` env also has `TRUST_PROXY_HOPS` (see Phase 5 notes). `.env` files hold DEMO values; every `CHANGE_ME` must be replaced by the owner
(`apps/api/.env`, `apps/web/.env`). `REVALIDATE_SECRET` must match in both apps.

## Architecture rules (do not break)

- Backend layering: `routes -> controllers -> services -> prisma`. No Prisma in controllers.
- Every response is `{ success, data? , error?: { code, message, details? } }`.
- Validation: Zod schemas from `@portfolio/shared`, parsed in controllers via `parse()` (Express 5
  makes `req.query` read-only, so there is no mutating validate middleware).
- Public GETs are open; every write is behind `requireAdmin`.
- Public pages are Server Components using `fetch(..., { next: { tags } })`. After each admin
  mutation the API calls `POST {WEB_ORIGIN}/api/revalidate` with `REVALIDATE_SECRET`
  (`apps/api/src/lib/revalidate.ts`). Tag names live in `CACHE_TAGS` (shared).
- Replacing/deleting an image deletes the Cloudinary asset (`lib/cloudinary.ts`). Publicids that
  start with `seed/` are placeholders and are never destroyed.
- The browser only talks to `/api/v1/*` on the WEB origin; `next.config.ts` rewrites it to the API.
  This keeps auth cookies first-party (so `sameSite=strict` works across Vercel + Render).
- No `any` anywhere. Strict TS, `noUncheckedIndexedAccess` on.

## Phase log

### Phase 1 — Scaffold (DONE)
- pnpm workspace, `tsconfig.base.json`, flat ESLint (`strictTypeChecked`), Prettier, docker-compose Postgres.
- `@portfolio/shared`: enums, `ApiResponse`, all Zod input schemas + TS types, `HomePayload`, `CACHE_TAGS`.
- `apps/api`: Express 5 skeleton, `env.ts` (Zod, exits on bad env), tsup config (bundles shared), vitest config.
- `apps/web`: Next 15 + Tailwind v4, `env.ts` (server/client split), Cloudinary image loader, API rewrite.
- Decisions: Zod 3.x (not 4), TypeScript pinned to 5 (TS 7 breaks `next.config.ts`), bcryptjs (no native
  build), Nodemailer only (no Resend), fonts limited to a curated list.

### Phase 2 — Database (DONE, migration NOT yet run by owner)
- `prisma/schema.prisma` per spec + indexes; `Profile`/`SiteSettings` use fixed id `"singleton"`;
  `User.refreshToken` stores a SHA-256 hash.
- `prisma/seed.ts` is idempotent: admin from env, settings, 7 sections, profile, value cards,
  socials, 14 skills, 3 published projects (+gallery), timeline items of all 3 types.
- Seed images are `placehold.co` URLs with `publicId` prefix `seed/`.
- Prisma 6 (not 7). `.env` files created with demo values.

### Phase 3 — API (DONE, 32 tests pass; nothing run against a real DB/Cloudinary yet)
- Auth: login/refresh/logout/me/password. httpOnly + sameSite=strict cookies, access 15 min,
  refresh 7 d (cookie path `/` so Next middleware can see it). Refresh rotation with reuse detection.
  Login limiter 5 failures / 15 min. Logout works with an expired access token.
- Public: `/public/home` (single aggregate), `/public/projects[/:slug]` (published only),
  `/public/github-activity` (6 h in-memory cache, GITHUB_TOKEN server-side), `POST /public/contact`
  (honeypot field `website`, 5/h/IP, SMTP notification).
- Admin: CRUD + reorder for skills, projects, timeline, socials, value-cards; sections (edit/toggle/
  reorder only); project images (add, alt, reorder, delete); profile, settings, messages (+bulk),
  stats, upload.
- Upload: magic-byte validation (`file-type`), images <= 5 MB (jpeg/png/webp/gif/avif, SVG rejected),
  PDF <= 10 MB only for folder `resume` (stored as Cloudinary raw, id ends in `.pdf`).
  Image URLs returned already contain `f_auto,q_auto`.
- Security: helmet, CORS to WEB_ORIGIN, Origin guard on unsafe methods, DOMPurify-style sanitisation
  via sanitize-html on project description/architecture, no secrets in responses.
- Tests (vitest + supertest, Prisma/Cloudinary/mailer mocked): auth, CRUD, upload, contact.

### Phase 4 — Public site (DONE; verified against a throwaway mock API, not a real DB)
- Theme system: brand colours come from `SiteSettings` and are injected as CSS variables in the root
  layout (`--primary --accent --bg --surface`); fixed derived tokens (`--fg --muted --line --ink
  --heat-*`) live in `globals.css` for dark and light. Tailwind v4 `@theme inline` maps them to
  utilities (`bg-surface`, `text-ink`, `border-line`, `bg-brand-gradient`, `text-gradient`, `card`, `glass`).
  `--on-primary` (white or near-black) is computed from the primary colour for AA contrast;
  `--ink` is a darkened primary used for accent TEXT in light theme.
- Visitor palette picker (5 presets) stores `{primary,accent,on}` in localStorage `accent`; a tiny
  inline script in `<head>` applies it before paint.
- Fonts: 8 curated Google fonts via `next/font` (`preload:false`, literal options required by
  next/font). Chosen heading/body font is selected through CSS vars from settings.
- Data: `src/lib/api.ts` (server-only) fetches `API_INTERNAL_URL` with `next.tags`; `getGithubActivity`
  returns null on any failure. `POST /api/revalidate` (timing-safe secret check) purges tags.
- Routes (`apps/web/src/app`): `(site)/(home)/page.tsx` renders sections in the order and visibility of
  `SectionConfig`; `(site)/projects` (tech filter), `(site)/projects/[slug]`; `not-found`, `error`,
  `global-error`, `sitemap.ts`, `robots.ts`; JSON-LD `Person` on home; dynamic `generateMetadata`.
- Components (`src/components/site`): Navbar (glass pill, scroll-spy, mobile Radix sheet, palette +
  theme toggle), Hero (typing roles, glow ring, floating badges), About (highlight words, value cards),
  Skills (server resolves icons -> client tabs with sliding pill + AnimatePresence), Projects (cards,
  Radix modal, carousel gallery, shareable `/projects/[slug]`), Journey (3 tabs, alternating timeline),
  Contact (copy buttons, RHF+zod form, honeypot, sonner), Activity (GitHub heatmap with tooltip),
  Footer, BackToTop. All motion respects `prefers-reduced-motion`.
- Icons: lucide v1 has NO brand icons -> social icons use `react-icons/fa6`, skill icons `react-icons/si`
  (resolved on the server so the big sets never reach the browser). Old lucide name `Code2` is aliased
  to `CodeXml` (seed now uses `CodeXml`).
- Gotchas: a `loading.tsx` makes Next stream before `notFound()` runs, so a missing slug would return
  HTTP 200. `loading.tsx` therefore lives only in `(site)/(home)/`; `/projects/[slug]` returns a real 404.
- Verified: `next build` OK, all sections render, 404 for unknown slug, robots/sitemap, revalidate route
  (401 bad secret / 200 good), `/api/v1/*` rewrite, desktop + mobile + light-theme screenshots.
- NOT yet verified: real API + DB, Lighthouse score, Playwright (Phase 6), keyboard/screen-reader pass.
- Decision: the contact heading ("Let's build something meaningful together.") and navbar labels are
  fixed UI copy per the spec; all other text is CMS-driven.

### Phase 5 — Admin dashboard (DONE; verified end-to-end against a real Postgres, API and production web build)
- Migration `apps/api/prisma/migrations/*_init` now exists (generated against a throwaway Postgres 16 container
  on :5440, which was removed afterwards). `db:migrate` + `db:seed` verified; seed is idempotent.
- Auth flow: `src/middleware.ts` guards `/admin/*`: verifies the access cookie via API `/auth/me`; if expired but a
  refresh cookie exists it refreshes server-side and forwards the new Set-Cookie to the browser; otherwise redirects
  to `/admin/login?next=…`. Prefetch requests skip the API call (cookie presence only). `lib/admin/client.ts` is the
  browser API client: single-flight refresh on 401, retry once, else redirect to login. `next` is validated (no open redirect).
- Layout: `components/admin/AdminShell.tsx` (collapsible sidebar persisted in localStorage, mobile drawer, unread
  badge from `["stats"]`, View-site link, theme toggle, logout). UI primitives in `components/ui/*` are hand-written
  shadcn-style wrappers over Radix (button, input, field, select, switch, slider, tabs, modal, confirm, …).
- Data layer: `lib/admin/resources.ts#createResource` gives list/create/update/remove/reorder hooks with optimistic
  updates + rollback + toasts. Messages and project gallery use their own react-query mutations.
- Pages (`app/admin/(panel)/*`): dashboard, profile, projects (+new, +[id]), skills, journey, value-cards, socials,
  sections, messages, settings, account. Reusable: SortableList (dnd-kit, pointer+keyboard), ImageUploader
  (react-easy-crop + upload), FileUploader (PDF), RichTextEditor (Tiptap v3, HTML out), TagInput, StringListInput,
  IconField (Simple Icons / Lucide pickers lazy-loaded via next/dynamic), ColorField, useUnsavedWarning, useConfirm.
- Forms: react-hook-form + zodResolver with `useForm<z.input<S>, unknown, z.output<S>>` whenever a schema has
  defaults. Date inputs are plain strings converted at submit. Project create keeps gallery images in local state and
  attaches them after the project exists; edit mode saves gallery changes immediately.
- Architecture is edited with the rich-text editor too (spec said markdown; the public site renders HTML).
- Playwright: `apps/web/playwright.config.ts` uses the system Chrome (`channel: "chrome"`); `e2e/admin.spec.ts` has 12
  tests (auth, token refresh, skills, project create->public site, validation/unsaved guard, sections, settings theme,
  contact->messages, account, profile). Uploads are stubbed with `page.route` (no Cloudinary needed). Run against a
  running API+web: `pnpm --filter @portfolio/web exec playwright test`. NOTE: test 2 does one wrong login; after 5
  failed logins within 15 min the login limiter blocks further logins until the API restarts or the window ends.
- Bugs found by the E2E run and fixed:
  1. Global per-IP limiter (300/min) was tripped by Next middleware/SSR calls (all from one IP) -> 429 on `/auth/me`.
     Removed the global limiter; admin API has a generous `adminLimiter` (600/min); public GETs are cached by Next.
  2. Behind Vercel->Render every visitor shared one IP (contact limit 5/h for the WHOLE site). Added `TRUST_PROXY_HOPS`
     (API env; 1 locally, 2 for Vercel rewrite -> Render). Verify after deploy that stored message IPs are the visitor's.
  3. Sonner toasts covered the sticky Save bar -> Toaster has a bottom offset.
  4. `<label for>` on the icon button replaced its name ("Icon *") -> explicit aria-label.
- NOT verified: real Cloudinary uploads/deletes, SMTP, GitHub GraphQL, Lighthouse, screen-reader pass, drag-and-drop by
  pointer (keyboard sensor is wired; E2E does not drag).
### Phase 6 — Polish, accessibility, Lighthouse, Playwright (DONE; measured on a real Postgres + API + production web build)
- Playwright: 32 tests pass (`e2e/admin.spec.ts` 13, `e2e/public.spec.ts` 13, `e2e/a11y.spec.ts` 5 incl. 12 admin pages x axe).
  Needs a running API + web: `pnpm test:e2e`. Axe runs with `reducedMotion: "reduce"` (a half-faded frame is not a real contrast failure).
  Public spec covers: every section renders, typing + reduced motion, scroll-spy, skills tabs (click + arrows), project modal
  (focus returns to the card, Esc), /projects filter, journey tabs, theme + accent persistence, mobile sheet, contact validation +
  honeypot, no horizontal overflow at 360/768/1280/1920/3840, SEO tags/JSON-LD/robots/sitemap/real 404, security headers, skip link.
- Lighthouse (lab, Chrome, `lighthouse` CLI): desktop = 100/100/100/100 on /, /projects, /projects/[slug]. Mobile (simulated slow 4G +
  4x CPU) = Accessibility/Best-practices/SEO 100; Performance 93-95 on /, 96 on /projects and 95 on detail WHEN images are
  right-sized. With the seed's 1280px placehold.co PNGs (loader cannot resize non-Cloudinary URLs) /projects scores ~90 mobile.
  Real Cloudinary images go through `cloudinary-loader.ts` (w_<n>,f_auto,q_auto) so this should not apply in production — re-measure
  after deploying with real images. The simulation is noisy (+-2).
- What moved the numbers (keep these): (1) `htmlLimitedBots: /.*/` so <meta> is in <head> not streamed into <body> (SEO 92->100);
  (2) NO `loading.tsx` on the homepage: a Suspense boundary made Next stream the page behind a skeleton + `$RC` swap script, which
  delayed LCP and caused a 0.42 CLS on desktop. `loading.tsx` exists ONLY in `projects/(list)/`; never add one to `projects/[slug]`
  (it would turn unknown slugs into HTTP 200). (3) Hero entrance is translate-only CSS (`animate-rise`) and below-the-fold `Reveal`
  is pure CSS scroll-driven animation (`animation-timeline: view()`, `backwards` fill): no JS, no hydration, content visible without
  JS / on unsupported browsers / with reduced motion. (4) Lazy chunks: framer-motion features via `<LazyMotion>` (`m.*` only,
  `strict`), Toaster, ContactForm (RHF+zod), ProjectModal, Radix popover + mobile menu (loaded on first hover/focus/click).
  Home first-load JS 231 kB -> ~163 kB. (5) Fonts are `preload:false` (preloading them competes with the hero image for bandwidth).
  (6) `preconnect` to the avatar origin and https://res.cloudinary.com. Tried and rejected: `experimental.inlineCss` (no gain, 3-min builds).
- Accessibility fixes found by axe: heading order (page h1 -> h2, modal h3), `/projects` needed an h1, labelled landmarks
  (two <aside>), skip-link target `#main` on every page, decorative react-icons get `aria-hidden`, Radix slider thumb needs
  aria-label, Select needs `ariaLabel` when it has no visible label, messages filter is toggle buttons (not tabs without panels),
  label-for on an icon button replaced its name -> explicit aria-label, modal returns focus to the opener (controlled Radix dialog has
  no Trigger, so `onCloseAutoFocus` is wired manually).
- Responsive fixes: admin list rows, sticky save bars and image uploaders stack on phones; root font-size scales up at 1920/2560/3200px
  so the layout does not look lost on 2K/4K screens. Security headers (nosniff, referrer-policy, frame, HSTS, permissions) added in
  `next.config.ts`; there is NO CSP on the web app (needs nonces for the inline theme/palette/JSON-LD scripts) — consider as follow-up.
- Default favicon: `src/app/icon.svg` (settings.faviconUrl overrides it).
- NOT done / caveats: real Cloudinary + SMTP + GitHub token paths still unverified (tests stub uploads; GitHub section shows its
  "temporarily unavailable" state without a token); pointer drag-and-drop not exercised by E2E; no real screen-reader session.
### Phase 7 — Docs and deploy config (DONE; the README path was executed end-to-end in a clean copy)
- `README.md`: Mermaid architecture + edit-propagation sequence diagram, local setup, env tables, admin how-to, scripts, tests,
  deployment guide (Neon -> Cloudinary -> Render -> Vercel -> first run + checklist), security notes, troubleshooting, limitations.
- Deploy files: `render.yaml` (API blueprint; build applies migrations; `TRUST_PROXY_HOPS=2`), `apps/web/vercel.json`
  (Root Directory must be `apps/web`), `apps/api/Dockerfile` (build from the repo ROOT; CMD runs `prisma migrate deploy` then
  `node dist/server.js` — no pnpm download at start), `.dockerignore`, `.github/workflows/ci.yml` (check + e2e with a Postgres service;
  move `.github/` to the git root if `portfolio/` is a subfolder — in this checkout the git root is the PARENT `WEB/` directory).
- Changes made in this phase: api `build` = `prisma generate && tsup`; `ADMIN_PASSWORD` is now optional at runtime (seed-only, the seed
  throws if missing); docker-compose host port is `${POSTGRES_PORT:-5432}` bound to 127.0.0.1 (+ healthcheck); root scripts `start`,
  `db:generate`, `db:deploy`, `test:e2e`.
- Verified: clean copy (no node_modules/.env) -> `pnpm install --frozen-lockfile` -> `.env` from examples -> `pnpm db:migrate` ->
  `pnpm db:seed` -> `pnpm build` -> `pnpm start` -> 32/32 Playwright tests pass; `pnpm dev` also serves site + admin and the key flows
  (login, create project -> appears on homepage, hide section) pass in dev mode. API Docker image builds, applies migrations and answers
  `/api/v1/health` within ~5 s.
- NOT verified: Render/Vercel/Railway deployments themselves, GitHub Actions run, real Cloudinary/SMTP/GitHub token.
- Environment note: the dev machine rebooted mid-session; exit code 137 during E2E was memory pressure (dev servers + Chrome), not a bug.
  Never use `pkill -f <pattern>` from the tool shell (it kills the shell itself).

## Production deployment (live as of 2026-10-14)

- Web: Vercel project `portfolio-cms` (team ebratuls-projects), Root Directory `apps/web`, URL https://portfolio-cms-ashy.vercel.app.
  Deploy from the repo root with `vercel --prod` (never from `apps/web`, the CLI would not upload `packages/shared`). Env (production):
  `API_INTERNAL_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `REVALIDATE_SECRET`. `.vercel/` is gitignored.
  `vercel link` writes `.env.local` (an OIDC token) and appends `.env*` to `.gitignore` — delete the file and revert that line
  (`.env*` would ignore the `.env.example` files).
- API: Render web service `portfolio-api` (id `srv-db7npc49v7es73cn4esg`, free plan, oregon), https://portfolio-api-59yk.onrender.com.
  Database: Prisma Postgres via a `postgres://…@pooled.db.prisma.io:5432/postgres?sslmode=require` URL (a `prisma+postgres://` URL does NOT work
  with this API). Auto-deploy on push to `main`. Render env must satisfy: `WEB_ORIGIN` == the Vercel origin exactly (it was wrongly
  `http://localhost:3000` once -> every browser request got 403 "Origin not allowed"), `REVALIDATE_SECRET` identical to Vercel's,
  `TRUST_PROXY_HOPS=2`. Render's API (`https://api.render.com/v1/services/<id>/env-vars/<KEY>` PUT, `/deploys` POST, `/resume` POST)
  was used to set env and deploy; a service suspended by the user must be resumed before it can deploy.
- Verified live: site/projects/admin-login/robots/sitemap return 200; anonymous /admin redirects to login; login and contact work through
  the Vercel rewrite; revalidate endpoint accepts the shared secret and rejects others; Origin guard blocks foreign origins.
- NOT verified on production: successful admin login + editing (password is only known to the owner), image upload to real Cloudinary,
  stored client IP of a contact message (confirms `TRUST_PROXY_HOPS`), SMTP delivery, GitHub graph (no `GITHUB_TOKEN`).
- Owner to-do: rotate secrets that appeared in chat (Render API key, Prisma DB password, REVALIDATE_SECRET), change the admin password
  in /admin/account, remove `ADMIN_PASSWORD` from Render, set SEO title in Site settings (still the seed default), `vercel git connect`
  for auto-deploys.

## Gotchas learned

- Never run `next build` while `next start` is serving the same `.next` (stale chunks -> console errors in Lighthouse).
- E2E login test does one wrong password: 5 failures within 15 min block logins until the API restarts or the window passes.

- `z.prettifyError` is Zod 4 only. `req.query` is read-only in Express 5.
- pnpm needs `typescript` resolvable inside `apps/web` for `next.config.ts`.
- ESLint `unbound-method` + supertest `any` bodies are relaxed for `tests/**` only.
