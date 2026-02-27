# Aust Umzuege - Project Guide

This project has **two separate concerns** that share a SvelteKit codebase but are otherwise independent:

1. **Public Website** (`src/routes/` excl. `admin/`) — static marketing site, SEO-optimized, prerendered
2. **Admin Dashboard** (`src/routes/admin/`) — client-side SPA, JWT auth, REST API backend

They share the build pipeline but have different architectures, styling patterns, and deployment considerations. See `src/routes/admin/CLAUDE.md` for full admin module documentation.

## Deployment

**Full deploy (build + optimize + upload):**
```bash
npm run build && python3 inline-css.py && python3 deploy-full.py
```

Steps:
1. `npm run build` - SvelteKit static build to `build/`
2. `python3 inline-css.py` - Inlines CSS `<link>` tags as `<style>` blocks (eliminates render-blocking requests)
3. `python3 deploy-full.py` - Uploads `build/` to KAS via FTP (requires `FTP_PASS` env var, load from `.env`)

**PHP-only changes** (e.g. `send-mail.php`): No rebuild needed, upload directly via FTP.

**Do NOT deploy without being asked.** Wait for explicit user instruction before deploying.

## Tech Stack

- **Framework**: SvelteKit with adapter-static (no SSR at runtime)
- **Hosting**: KAS shared hosting (Apache, no Node.js)
- **Deployment**: FTP via `deploy-full.py`
- **CSS**: Scoped Svelte styles + `src/styles/global.css` (design tokens)
- **Fonts**: Self-hosted Inter (woff2), `font-display: optional`
- **Analytics**: Google Analytics (GA4), deferred loading

## Public Website

- Static pages prerendered at build time
- Forms submit to PHP `mail()` via `static/send-mail.php`
- SEO: structured data, manually managed `static/sitemap.xml`
- Root layout provides Navbar, Footer, cookie banner (skipped for `/admin` routes)

### Key routes
- `src/routes/` — homepage, kontakt, impressum, datenschutz, AGB, etc.
- `src/routes/leistungen/` — service pages (privatumzug, firmenumzug, etc.)
- `src/routes/ratgeber/` — guide/blog articles
- `src/routes/kostenloses-angebot/` — public quote request form
- `src/routes/foto-angebot/` — photo quote form (noindex, not in sitemap)
- `src/routes/cookie-einstellungen/` — cookie preferences

## Admin Dashboard

Separate SPA with its own layout, auth, and API layer. **See `src/routes/admin/CLAUDE.md` for full documentation** including all API endpoints, data models, components, and patterns.

### Key facts
- Client-side only: `ssr: false`, `prerender: false`
- JWT auth against `https://api.aufraeumhelden.com`
- SPA fallback: `svelte.config.js` → `fallback: 'admin.html'`
- Not indexed: noindex meta, excluded from sitemap
- Stores/utils use `.svelte.ts` extension (Svelte 5 runes)
- Documentation: function-level NatSpec required, see `src/routes/admin/CLAUDE.md` for standards
- Reference docs: `src/routes/admin/README.md` (overview), `src/routes/admin/API.md` (endpoints)

### Admin file locations
- `src/routes/admin/` — pages (dashboard, quotes, offers, customers, emails, calendar, settings)
- `src/lib/components/admin/` — admin components (Sidebar, DataTable, StatusBadge, PriceInput, RouteMap, Toast)
- `src/lib/stores/auth.svelte.ts` — auth store
- `src/lib/utils/api.svelte.ts` — API helpers + formatting utils

## Project Structure

- `src/routes/` — public website pages
- `src/routes/admin/` — admin SPA (see `src/routes/admin/CLAUDE.md`)
- `src/lib/components/` — public website components
- `src/lib/components/admin/` — admin-only components
- `src/lib/stores/` — Svelte stores (auth)
- `src/lib/utils/` — API helpers, formatting
- `static/` — static assets (images, fonts, PHP, robots.txt, sitemap.xml)
- `inline-css.py` — post-build CSS inlining script
- `deploy-full.py` — FTP deployment script

## Important Notes

- Files using Svelte 5 runes (`$state`, `$derived`, etc.) outside `.svelte` files must use `.svelte.ts` extension
- Imports to `.svelte.ts` files need explicit `.svelte` suffix: `from '$lib/stores/auth.svelte'`
- Root layout conditionally skips site chrome (Navbar, Footer, etc.) for `/admin` routes
- `svelte.config.js` uses `strict: false` and `fallback: 'admin.html'` to support the admin SPA
- Sitemap is manually managed at `static/sitemap.xml`
- `.htaccess` handles 301 redirects, HTTPS/www enforcement, gzip, caching, and security headers
