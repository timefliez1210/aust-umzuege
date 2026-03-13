# Aust Umzüge — Frontend

> **SvelteKit frontend for a moving company in Hildesheim, Germany.**
> Two concerns in one repo: a prerendered public marketing site and a client-side admin dashboard talking to a REST API.

---

## What's in here

| Concern | Routes | Rendering | Auth |
|---------|--------|-----------|------|
| **Public website** | `src/routes/` (excl. admin) | Static prerender (SSG) | None |
| **Admin dashboard** | `src/routes/admin/` | Client-side SPA | JWT |

They share the build pipeline, utilities, and TypeScript types — but have different architectures, design systems, and deployment considerations.

---

## Stack

- **[SvelteKit](https://kit.svelte.dev/)** + **Svelte 5** (runes: `$state`, `$derived`, `$effect`)
- **TypeScript** — strict mode throughout
- **Vite** — build tool + Vitest for unit tests
- **adapter-static** — zero runtime, pure HTML/CSS/JS output
- **Self-hosted Inter** — woff2, `font-display: optional`
- **Lucide Svelte** — icons in admin UI
- **Leaflet** — route map in inquiry detail
- **Hosted on KAS** — Apache shared hosting, deployed via FTP

---

## Project structure

```
src/
├── routes/
│   ├── +layout.svelte          # Root layout — skips chrome for /admin routes
│   ├── +page.svelte            # Homepage
│   ├── leistungen/             # 10 service pages
│   ├── ratgeber/               # 4 guide/blog articles
│   ├── kontakt/                # Contact form
│   ├── kostenloses-angebot/    # Quote request form
│   └── admin/                  # ← Admin SPA (see admin/CLAUDE.md)
│       ├── +layout.svelte      # Shell: sidebar, topbar, auth guard
│       ├── +page.svelte        # Dashboard — KPIs, activity, conflicts
│       ├── inquiries/          # Inquiry list + detail
│       ├── customers/          # Customer directory + detail
│       ├── emails/             # Email threads + drafts
│       ├── calendar/           # Monthly booking calendar
│       ├── employees/          # Employee management + hours
│       └── settings/           # User management, passwords, roles
│
├── lib/
│   ├── components/             # Public UI components
│   ├── components/admin/       # Admin-only components
│   ├── stores/                 # Auth store (auth.svelte.ts)
│   ├── utils/                  # API client, formatting, pricing, calendar
│   └── data/
│       └── structuredData.ts   # All Schema.org JSON-LD (centralized)
│
└── styles/
    ├── global.css              # Public design tokens (dark theme)
    └── admin.css               # Admin design tokens (neumorphic, light)

static/
├── sitemap.xml                 # Manually managed
├── robots.txt                  # AI crawler directives included
├── send-mail.php               # PHP mail handler for contact forms
├── fonts/                      # Self-hosted Inter woff2
└── [images]                    # WebP, multiple resolutions (400w–1536w)
```

---

## Getting started

```bash
bun install
bun run dev        # http://localhost:5173
```

---

## Commands

```bash
bun run dev              # Dev server
bun run build            # Production build → build/
bun run preview          # Preview the build locally
bun run check            # svelte-check + tsc
bun run test             # Vitest unit tests
bun run test:watch       # Vitest in watch mode
bun run lighthouse       # Build + Lighthouse audit (desktop)
bun run lighthouse:mobile
```

---

## Deploy

**Full deploy (build + optimize + upload):**
```bash
./deploy-all.sh
```

This runs three steps:
1. `bun run build` — SvelteKit static build to `build/`
2. `python3 inline-css.py` — Inlines `<link>` CSS as `<style>` blocks (eliminates render-blocking requests)
3. `python3 deploy-full.py` — Uploads `build/` to KAS via FTP

**Requires** `FTP_PASS` in `.env` (see `.env.example`).

| Script | What it deploys |
|--------|----------------|
| `./deploy-all.sh` | Everything |
| `./deploy-public.sh` | Public site only (no admin bundle) |
| `./deploy-admin.sh` | Admin SPA only |

PHP-only changes (e.g. `send-mail.php`): skip the build, upload directly via FTP.

---

## Public website

Static pages prerendered at build time. No runtime server.

- **Forms** submit to `static/send-mail.php` (PHP `mail()`)
- **SEO**: Schema.org structured data in `src/lib/data/structuredData.ts`, manual `static/sitemap.xml`
- **Analytics**: GA4 — deferred, fires on interaction or after 8s idle
- **Fonts**: Self-hosted, GDPR-clean (no Google Fonts)
- **Images**: WebP throughout, multiple srcset sizes, lazy-loaded below fold

### Service pages

| Route | Page |
|-------|------|
| `/leistungen/privatumzug` | Private moves |
| `/leistungen/firmenumzug` | Corporate moves |
| `/leistungen/seniorenumzug` | Senior moves |
| `/leistungen/haushaltsaufloesung` | Estate clearance |
| `/leistungen/montage` | Assembly & disassembly |
| `/leistungen/lagerung` | Storage |
| `/leistungen/halteverbot` | Parking ban setup |
| `/leistungen/umzugsberatung` | Moving consultation |
| `/leistungen/umzugshelfer` | Moving helpers |
| `/leistungen/fern-ueberseeumzug` | International & overseas |

### Structured data

All Schema.org JSON-LD lives in `src/lib/data/structuredData.ts`:

| Export | Schema type |
|--------|-------------|
| `businessInfo` | `MovingCompany` — address, geo, reviews, sameAs |
| `website` | `WebSite` |
| `services.*` | `Service` — one per service page |
| `articles.*` | `Article` — one per ratgeber |
| `aggregateRating` | `AggregateRating` |
| `reviews` | `Review[]` — carousel reviews |
| `createBreadcrumbs()` | `BreadcrumbList` factory |

`businessInfo` is emitted on every service page so Google always has the full address context.

---

## Admin dashboard

Client-side only SPA (`ssr: false`, `prerender: false`).

- **Auth**: JWT access + refresh tokens in `localStorage`
- **API client**: `src/lib/utils/api.svelte.ts` — auto-injects Bearer, retries on 401
- **Auth store**: `src/lib/stores/auth.svelte.ts` — Svelte 5 runes
- **SPA fallback**: Apache `.htaccess` rewrites all `/admin/*` to `admin.html`

### Admin components

| Component | Purpose |
|-----------|---------|
| `Sidebar.svelte` | Nav sidebar — collapsible desktop, drawer on mobile |
| `DataTable.svelte` | Sortable table, row click, empty state, horizontal scroll |
| `StatusBadge.svelte` | Color-coded pill for 20+ statuses |
| `PriceInput.svelte` | Brutto/netto toggle, auto 19% VAT calculation |
| `RouteMap.svelte` | Leaflet map with route polyline + distance badge |
| `Toast.svelte` | Success/error/info toasts, 4s auto-dismiss |
| `ImageLightbox.svelte` | Full-size image overlay with bounding box visualization |

### Design

Neumorphic — soft inset/outset shadows on a light grey (`#e8ecf1`) base, indigo primary, German UI throughout. Mobile breakpoint at 768px with 44px minimum touch targets.

> **Full admin docs**: [`src/routes/admin/CLAUDE.md`](src/routes/admin/CLAUDE.md)
> **API reference**: [`src/routes/admin/API.md`](src/routes/admin/API.md)

---

## Conventions

- **Svelte 5 runes** everywhere — `$state`, `$derived`, `$effect`, `$props`
- Files using runes outside `.svelte` must use `.svelte.ts` extension
- Imports to `.svelte.ts` need explicit suffix: `from '$lib/stores/auth.svelte'`
- **Currency**: stored in cents, displayed via `formatEuro()` — de-DE locale
- **Dates**: German locale via `formatDate()` / `formatDateTime()`
- **Admin errors**: always `showToast(message, 'error')`
- **NatSpec comments** required on all admin functions — see `admin/CLAUDE.md`

---

## Environment variables

```bash
VITE_API_BASE=https://api.aufraeumhelden.com
VITE_PHOTO_API_URL=https://api.aufraeumhelden.com/api/v1/submit/photo
FTP_HOST=w019276c.kasserver.com
FTP_USER=f0180dc8
FTP_PASS=<secret>
```

Copy `.env.example` → `.env` and fill in `FTP_PASS`.

---

## Tests

Unit tests live next to their source in `src/lib/utils/`:

```bash
bun run test
```

Covers: `format`, `pricing`, `volume`, `floor`, `sorting`, `calendar`.

---

## SEO

- **Score**: 84/100 (nearest competitor: 58/100)
- **Indexed pages**: growing from 22 → 51+ planned
- **Rich results active**: Breadcrumbs, FAQ, Review snippets, Image Metadata, HowTo
- Roadmap: [`ACTION-PLAN.md`](ACTION-PLAN.md) · [`seo-domination-plan.md`](seo-domination-plan.md)

---

## Further reading

| File | What's in it |
|------|-------------|
| [`CLAUDE.md`](CLAUDE.md) | Full project guide |
| [`src/routes/admin/CLAUDE.md`](src/routes/admin/CLAUDE.md) | Admin module deep-dive |
| [`src/routes/admin/API.md`](src/routes/admin/API.md) | REST API endpoint reference |
| [`ACTION-PLAN.md`](ACTION-PLAN.md) | SEO action items + status |
| [`seo-domination-plan.md`](seo-domination-plan.md) | Full SEO growth roadmap |
| [`Audit Reports/`](Audit%20Reports/) | SEO audit, competitor analysis, blog audit |
