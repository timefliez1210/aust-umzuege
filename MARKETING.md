# 🌐 Public Marketing Website

SEO-optimized, prerendered static pages at `www.aust-umzuege.de`. **Changes go live immediately on deploy.**

> **Parent context**: [../AGENTS.md](../AGENTS.md)

## ⚠️ Production Impact

Every change to these pages is indexed by Google, served to real customers, and directly affects conversion. Follow these rules:

- **No console.log** in production builds — use `if (browser)` guards for any debug logging
- **No broken links** — check all internal links after changes
- **No layout shifts** — images need `width`/`height` attributes
- **German language** everywhere — no English strings visible to users
- **Test on mobile** — 60%+ traffic is mobile
- **SEO meta tags** — every page needs `<title>`, `<meta description>`, `StructuredData`

## Pages

| Route | Purpose | SEO Priority |
|-------|---------|-------------|
| `/` | Homepage — hero, services, CTA, reviews | Critical |
| `/leistungen` | Service overview (Privatumzug, Firmenumzug, etc.) | Critical |
| `/leistungen/[slug]` | Individual service pages | High |
| `/ratgeber` | Guide/blog articles | Medium (long-tail keywords) |
| `/kostenloses-angebot` | Contact/quote request form | Critical (conversion) |
| `/foto-angebot` | Photo upload form (noindex, not in sitemap) | N/A |
| `/kontakt` | Contact form + phone + email | Medium |
| `/impressum` | Legal notice (Impressum) | Legal requirement |
| `/datenschutz` | Privacy policy | Legal requirement |
| `/agb` | Terms & conditions | Legal requirement |
| `/cookie-einstellungen` | Cookie consent management | Low |

## Architecture

- **Prerendered at build time** (`prerender = true` in root `+layout.ts`)
- **Static HTML** — no JavaScript required for initial render
- **Hydrated** — interactive components (VolumeCalculator, MediaDropzone) load after page paint
- **No auth** — all pages are public
- **Not indexed**: `/foto-angebot` has `noindex` meta tag

## Key Components (Marketing-Only)

| Component | Purpose |
|-----------|---------|
| `Navbar.svelte` | Desktop/mobile navigation with scroll behavior |
| `Footer.svelte` | Contact info, links, legal |
| `Hero.svelte` | Homepage hero section |
| `CTASection.svelte` | Call-to-action blocks |
| `ServiceBoxes.svelte` | Service overview cards |
| `VolumeCalculator.svelte` | Interactive volume estimation (used in `/kostenloses-angebot`) |
| `MediaDropzone.svelte` | Photo upload (used in `/foto-angebot`) |
| `MetaTags.svelte` | Per-page SEO meta tags |
| `StructuredData.svelte` | JSON-LD structured data for Google |
| `CookieBanner.svelte` / `ConsentManager.svelte` | GDPR cookie consent |
| `WhatsAppButton.svelte` | Floating WhatsApp contact button |

## Forms & Data Flow

### `/kostenloses-angebot` (Quote Request)
- VolumeCalculator component → `volumeM3` + `itemSummary`
- Form data sent to backend via `POST /api/v1/submit/manual`
- Email-based flow: email agent picks up form submission → creates inquiry → offer

### `/foto-angebot` (Photo Upload)
- MediaDropzone → S3 upload → `POST /api/v1/submit/photo`
- Service type selection via `serviceConfig.ts` (data-driven, add service = add entry)
- No authentication required

## SEO Checklist (Before Deploy)

- [ ] Every new page has `<title>` and `<meta name="description">`
- [ ] `StructuredData` component added with correct schema type
- [ ] Internal links use relative paths (no hardcoded `www.aust-umzuege.de`)
- [ ] Images have `width`, `height`, `alt` attributes
- [ ] `static/sitemap.xml` updated if pages added/removed
- [ ] Lighthouse score > 90 for Performance, Accessibility, SEO
- [ ] No `console.log` statements in production code
- [ ] Mobile layout tested (375px, 768px, 1024px breakpoints)
- [ ] Cookie consent works before any tracking fires

## Sitemap

Manually maintained at `static/sitemap.xml`. Add new pages there. Exclude `/foto-angebot` (noindex).

## Deployment

Part of `deploy-full.py` — builds, inlines CSS, uploads to KAS via FTP. **Deploy only when asked.**