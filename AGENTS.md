# frontend — SvelteKit Umzugsplattform

Git submodule → `git@github.com:timefliez1210/aust-umzuege.git`

**One build, three audiences, three architectures.** Changes to public pages go live immediately on deploy — treat with care.

## The Three Audiences

| Area | Routes | Auth | Rendering | Deploy Impact |
|------|--------|------|-----------|---------------|
| **Marketing** | `/`, `/leistungen`, `/ratgeber`, `/kontakt`, `/kostenloses-angebot`, `/impressum`, `/datenschutz`, `/agb`, `/cookie-einstellungen` | None | `prerender: true` — static HTML at build time | **High** — public-facing, SEO-critical, indexed by Google |
| **Admin** | `/admin/*` | JWT (admin role) | `ssr: false`, `prerender: false` — client SPA | Medium — internal, Alex-only |
| **Worker** | `/worker/*` | JWT (employee role) | `ssr: false`, `prerender: false` — client SPA | Medium — internal, employees only |

---

## If You're Working On…

### 🌐 Public Marketing Website → [MARKETING.md](MARKETING.md)

SEO-optimized, prerendered static pages. **Changes go live immediately on deploy.** Read this before touching any page under `/routes/` (except `admin/` and `worker/`).

### 🖥️ Admin Dashboard → [src/routes/admin/AGENTS.md](src/routes/admin/AGENTS.md)

Internal SPA, JWT auth, REST API backend. Read this before touching anything under `/routes/admin/`.

### 👷 Worker Self-Service → No deep doc yet

Employee clock-in/out, hours, profile. 4 pages: login, hours, schedule, profile. Uses `$lib/stores/worker.svelte.ts`.

---

## Shared Infrastructure

| File/dir | Used by |
|----------|----------|
| `$lib/utils/api.svelte.ts` | Admin + Worker (JWT auth, fetch wrapper) |
| `$lib/utils/format.ts` | All three (formatEuro, formatDate) |
| `$lib/utils/constants.ts` | Admin (INQUIRY_STATUS_LABELS, CUSTOMER_TYPE_LABELS) |
| `$lib/utils/floor.ts` | Marketing + Admin (German floor parsing) |
| `$lib/stores/auth.svelte.ts` | Admin |
| `$lib/stores/worker.svelte.ts` | Worker |
| `$lib/stores/cookieConsent.ts` | Marketing |
| `$lib/components/` (top-level) | Marketing (Navbar, Footer, Hero, CTA, etc.) |
| `$lib/components/admin/` | Admin only |
| `$lib/components/MediaDropzone.svelte` | Marketing (foto-angebot) + Admin (estimation upload) |
| `$lib/components/VolumeCalculator.svelte` | Marketing (kostenloses-angebot) |

## Build & Deploy

```bash
npm run build        # SvelteKit static build → build/
python3 inline-css.py   # Post-build: inline CSS <link> as <style> (eliminates render-blocking)
python3 deploy-full.py  # FTP entire build/ to KAS (requires FTP_PASS in .env)
```

**Do NOT deploy without being asked.** The public site is live at `www.aust-umzuege.de`.

### SvelteKit Config

`svelte.config.js`: `adapter-static`, `fallback: 'admin.html'` (SPA fallback for `/admin/*` and `/worker/*`).

Root layout `+layout.svelte`: `prerender = true`. Conditionally skips Navbar/Footer for `/admin` routes.
## ⚠️ Connected Changes

| If you change... | ...also verify |
|---|---|
| API endpoint URL or response shape | `api.svelte.ts` fetch functions, all admin pages calling that endpoint, backend route handler |
| `INQUIRY_STATUS_LABELS` or `CUSTOMER_TYPE_LABELS` | Backend `InquiryStatus.as_str()` values, admin status badges, calendar status colors |
| Admin page layout or component | Shared components in `$lib/components/admin/` (used across multiple pages) |
| Volume calculator form | Backend `submissions.rs` `handle_submission()`, `serviceConfig.ts` in foto-angebot |
| CSS variables or design tokens | `admin.css` centrally, all admin pages that use the same classes |
| Employee assignment panel | Used in both inquiry detail and calendar side panel — changes affect both. Multi-day mode auto-detects from distinct `job_date` count and switches to a deduplicated summary view. |
| Cookie consent or analytics | `ConsentManager.svelte` gates all tracking — must work before any GA fires |
| `/foto-angebot` form fields | Backend `submissions.rs` multipart parser must match form field names exactly |
