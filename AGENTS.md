# frontend — SvelteKit Umzugsplattform

Git submodule → `git@github.com:timefliez1210/aust-umzuege.git`

**One build, three audiences, three architectures.** Changes to public pages go live immediately on deploy — treat with care.

## The Three Audiences

| Area | Routes | Auth | Rendering | Deploy Impact |
|------|--------|------|-----------|---------------|
| **Marketing** | `/`, `/leistungen`, `/ratgeber`, `/kontakt`, `/kostenloses-angebot`, `/foto-angebot`, `/firmenumzug-wolfsburg`, `/umzug-hannover`, `/umzug-braunschweig`, `/impressum`, `/datenschutz`, `/agb`, `/cookie-einstellungen` | None | `prerender: true` — static HTML at build time | **High** — public-facing, SEO-critical, indexed by Google |
| **Admin** | `/admin/*` | JWT (admin role) | `ssr: false`, `prerender: false` — client SPA | Medium — internal, Alex-only |
| **Worker** | `/worker/*` | OTP session (employee role) | `ssr: false`, `prerender: false` — client SPA | Medium — internal, employees only |

The marketing site is prerendered static HTML. Admin and Worker are pure client-side SPAs that mount after `admin.html` / `worker.html` bootstrap. Both SPAs share the same SvelteKit build and `adapter-static` output, but have **completely separate auth layers**:

- **Admin** → JWT (`$lib/stores/auth.svelte.ts`): email/password → `access_token` + `refresh_token` in `localStorage`. Auto-refresh on 401.
- **Worker** → OTP session (`$lib/stores/worker.svelte.ts`): email → 6-digit code → `session_token` in `localStorage`. No refresh — on 401 → immediate logout + redirect to `/worker/login`.

---

## If You're Working On…

### 🌐 Public Marketing Website → [MARKETING.md](MARKETING.md)

SEO-optimized, prerendered static pages. **Changes go live immediately on deploy.** Read this before touching any page under `/routes/` (except `admin/` and `worker/`).

### 🖥️ Admin Dashboard → [src/routes/admin/AGENTS.md](src/routes/admin/AGENTS.md)

Internal SPA, JWT auth, REST API backend. Read this before touching anything under `/routes/admin/`.

### 👷 Worker Self-Service → This file

Employee portal at `/worker/*`. 5 pages: login, schedule, hours, jobs detail, profile.

- **Auth flow**: OTP via email. `POST /api/v1/employee/auth/request` sends code; `POST /api/v1/employee/auth/verify` returns token + profile.
- **API layer**: `$lib/stores/worker.svelte.ts` — `workerFetch`, `workerGet`. On 401 → auto-logout + redirect.
- **Layout**: Mobile-first shell (`max-width: 480px` centered card), bottom nav with 3 items (Einsätze, Stunden, Profil), dark header bar, logout button.
- **Pages**:
  - `/worker/login` — Email → OTP code. No sidebar, no auth guard.
  - `/worker/schedule` — Upcoming job list with day-grouped cards.
  - `/worker/hours` — Clock in/out per job, open timer, manual entry.
  - `/worker/jobs/[id]` — Job detail, route, customer contact, notes.
  - `/worker/profile` — Employee profile view.

---

## Shared Infrastructure

| File/dir | Used by |
|----------|----------|
| `$lib/utils/api.svelte.ts` | Admin (JWT auth, fetch wrapper, auto-refresh, file download) |
| `$lib/stores/worker.svelte.ts` | Worker (OTP session, fetch wrapper, auto-logout on 401) |
| `$lib/utils/format.ts` | All three (formatEuro, formatDate, formatDateTime, formatTime) |
| `$lib/utils/status.ts` | Admin (INQUIRY_STATUS_LABELS) |
| `$lib/utils/constants.ts` | Admin (CUSTOMER_TYPE_LABELS) |
| `$lib/utils/floor.ts` | Marketing + Admin (German floor parsing) |
| `$lib/stores/auth.svelte.ts` | Admin |
| `$lib/stores/worker.svelte.ts` | Worker |
| `$lib/stores/cookieConsent.ts` | Marketing |
| `$lib/components/` (top-level) | Marketing (Navbar, Footer, Hero, CTA, etc.) |
| `$lib/components/admin/` | Admin only |
| `$lib/components/MediaDropzone.svelte` | Marketing (foto-angebot) + Admin (estimation upload) |
| `$lib/components/VolumeCalculator.svelte` | Marketing (kostenloses-angebot) |

---

## Build & Deploy

```bash
npm run build        # SvelteKit static build → build/
python3 inline-css.py   # Post-build: inline CSS <link> as <style> (eliminates render-blocking)
python3 deploy-full.py  # FTP entire build/ to KAS (requires FTP_PASS env var)
```

**Do NOT deploy without being asked.** The public site is live at `www.aust-umzuege.de`.

### SvelteKit Config

`svelte.config.js`: `adapter-static`, `fallback: 'admin.html'` (SPA fallback for `/admin/*` and `/worker/*`).

Root layout `+layout.svelte`: conditionally skips Navbar/Footer for `/admin` and `/worker` routes.
Root layout `+layout.ts`: `prerender = true`.

---

## ⚠️ Connected Changes

| If you change... | ...also verify |
|---|---|
| API endpoint URL or response shape | `api.svelte.ts` fetch functions, **all** admin pages calling that endpoint, backend route handler, and **worker pages** using `workerFetch`/`workerGet` |
| `INQUIRY_STATUS_LABELS` or `CUSTOMER_TYPE_LABELS` | Backend `InquiryStatus.as_str()` values, admin status badges, calendar status colors |
| Admin page layout or component | Shared components in `$lib/components/admin/` (used across multiple pages) |
| Volume calculator form | Backend `submissions.rs` `handle_submission()`, `serviceConfig.ts` in foto-angebot |
| CSS variables or design tokens | `admin.css` centrally, all admin pages that use the same classes |
| Employee assignment panel | Used in both inquiry detail and calendar side panel — changes affect both. Multi-day mode auto-detects from distinct `job_date` count and switches to a deduplicated summary view. |
| Cookie consent or analytics | `ConsentManager.svelte` gates all tracking — must work before any GA fires |
| `/foto-angebot` form fields | Backend `submissions.rs` multipart parser must match form field names exactly |
| Worker routes or API client | `$lib/stores/worker.svelte.ts` auth flow, all `/worker/*` pages importing `workerGet`/`workerFetch` |
