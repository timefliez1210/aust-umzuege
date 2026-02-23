# Aust Umzuege - Project Guide

## Deployment

**Full deploy (build + optimize + upload):**
```bash
npm run build && python3 inline-css.py && python3 deploy-full.py
```

Steps:
1. `npm run build` - SvelteKit static build to `build/`
2. `python3 inline-css.py` - Inlines CSS `<link>` tags as `<style>` blocks (eliminates render-blocking requests)
3. `python3 deploy-full.py` - Uploads `build/` to KAS via FTP

**PHP-only changes** (e.g. `send-mail.php`): No rebuild needed, upload directly via FTP.

**Do NOT deploy without being asked.** Wait for explicit user instruction before deploying.

## Tech Stack

- **Framework**: SvelteKit with adapter-static (no SSR at runtime)
- **Hosting**: KAS shared hosting (Apache, no Node.js)
- **Deployment**: FTP via `deploy-full.py`
- **CSS**: Scoped Svelte styles + `src/styles/global.css` (design tokens)
- **Forms**: PHP `mail()` via `static/send-mail.php`
- **Fonts**: Self-hosted Inter (woff2), `font-display: optional`
- **Analytics**: Google Analytics (GA4), deferred loading

## Project Structure

- `src/routes/` - SvelteKit pages
- `src/routes/admin/` - Admin dashboard (noindex, not in sitemap, `ssr: false`, `prerender: false`)
- `src/routes/foto-angebot/` - Photo quote form (noindex, not in sitemap)
- `src/lib/components/` - Reusable Svelte components
- `src/lib/components/admin/` - Admin-specific components
- `src/lib/stores/auth.svelte.ts` - Admin auth store (uses Svelte 5 runes, must be `.svelte.ts`)
- `src/lib/utils/api.svelte.ts` - Admin API helpers (imports rune files, must be `.svelte.ts`)
- `static/` - Static assets (images, fonts, PHP, robots.txt, sitemap.xml)
- `inline-css.py` - Post-build CSS inlining script
- `deploy-full.py` - FTP deployment script

## Important Notes

- Files using Svelte 5 runes (`$state`, `$derived`, etc.) outside `.svelte` files must use `.svelte.ts` extension
- Imports to `.svelte.ts` files need explicit `.svelte` suffix: `from '$lib/stores/auth.svelte'`
- Root layout conditionally skips site chrome (Navbar, Footer, etc.) for `/admin` routes
- `svelte.config.js` uses `strict: false` and `fallback: 'admin.html'` to support the admin SPA
- Sitemap is manually managed at `static/sitemap.xml`
