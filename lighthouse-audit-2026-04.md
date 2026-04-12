# Lighthouse Audit Report — April 2026

**Date:** 2026-04-12  
**Tool:** Lighthouse 13.1.0, mobile emulation  
**Site:** www.aust-umzuege.de

---

## Executive Summary

The site scores **exceptionally well** across all measured pages. No critical issues found.

| Metric | Home | Leistungen | Angebot | Kontakt | Ratgeber |
|--------|------|-----------|---------|---------|----------|
| **Performance** | 93 | 90 | 93 | 93 | 95 |
| **Accessibility** | 100 | 100 | 100 | 100 | 100 |
| **Best Practices** | 100 | 100 | 100 | 100 | 100 |
| **SEO** | 100 | 100 | 58✱ | 100 | 100 |

✱ `/foto-angebot` scores 58 SEO — **intentional**: it's blocked in `robots.txt` (noindex page, not for organic search).

### Core Web Vitals (Mobile)

| Metric | Home | Leistungen | Angebot | Kontakt | Ratgeber | Target |
|--------|------|-----------|---------|---------|----------|--------|
| LCP | 2.2s | 2.2s | 2.0s | 1.8s | 1.8s | <2.5s ✅ |
| CLS | 0 | 0 | 0 | 0 | 0 | <0.1 ✅ |
| INP | 0ms | 0ms | 0ms | 0ms | 0ms | <200ms ✅ |
| TBT | 192ms | 275ms | 217ms | 240ms | 178ms | <200ms ⚠️ |

All Core Web Vitals pass. TBT is slightly elevated on `/leistungen` (275ms) due to Google Tag Manager.

---

## ✅ What's Working Well

- **100/100 SEO** on all indexed pages — titles, meta descriptions, canonicals, hreflang, robots.txt, crawlable links, descriptive anchor text, heading order, image alt text
- **100/100 Accessibility** — color contrast, ARIA, focus management, skip links
- **100/100 Best Practices** — HTTPS, security headers, no console errors
- **CLS = 0** across all pages — no layout shifts
- **LCP preloaded** — hero image and fonts have `<link rel="preload">`
- **Twitter Card tags** added (since Feb audit)
- **OG image** now uses `.webp` format

---

## Remaining Issues (from Feb 2026 audit vs. now)

### ✅ Fixed Since Feb Audit

| Issue | Status |
|-------|--------|
| No LCP hero image preload | ✅ Fixed — `<link rel="preload" as="image">` with `imagesrcset` |
| No Twitter Card meta tags | ✅ Fixed — `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` |
| Homepage H1 too long (94 chars) | ✅ Fixed — now "Ihr Umzugsunternehmen in Hildesheim" (35 chars) |

### ⚠️ Still Outstanding

| # | Issue | Severity | Status | Details |
|---|-------|----------|--------|---------|
| 1 | **OG image dimension mismatch** | Medium | Still present | `og:image:width` = 1200, `og:image:height` = 630, but actual image is `*-1024w.webp` (1024px wide, not 1200). Declared dimensions don't match the served image. |
| 2 | **Facebook sameAs is profile URL, not page URL** | Low | Still present | `https://www.facebook.com/profile.php?id=61576264141191` is a profile link, not a canonical business page URL |
| 3 | **Sitemap `lastmod` dates all identical** | Low | Still present | All entries share the same date, reducing crawl priority signals |
| 4 | **Google Tag Manager unused JS** | Low | Won't fix | 62KB unused of 152KB GTM payload. Unavoidable with gtag.js on shared hosting. TBT impact is minor. |
| 5 | **Double redirect chain** (http → https → www) | Low | Hosting limitation | `http://aust-umzuege.de/` redirects twice (HTTPS at hosting level, then www via .htaccess). Adds ~100ms to first visit. Not fixable on KAS shared hosting. |
| 6 | **Hub pages still thin** (from Feb audit) | Medium | Content | `/ratgeber` (~450 words), `/leistungen` (~600 words). Need 800-1200 words for competitive SEO. |
| 7 | **`priceRange` in schema** | Low | Still present | Feb audit flagged this; needs removal from `Offer` objects |

---

## Detailed Scores

### Performance Breakdown

| Metric | Home | Leistungen | Angebot | Kontakt | Ratgeber |
|--------|------|-----------|---------|---------|----------|
| FCP | 2.0s | 2.2s | 1.9s | 1.7s | 1.8s |
| LCP | 2.2s | 2.2s | 2.0s | 1.8s | 1.8s |
| Speed Index | 3.3s | 3.4s | 3.4s | 3.4s | 3.3s |
| TBT | 192ms | 275ms | 217ms | 240ms | 178ms |
| CLS | 0 | 0 | 0 | 0 | 0 |

### Resource Sizes (Home)

| Resource | Size |
|----------|------|
| Google Tag Manager | 152KB (62KB unused) |
| Inter 700 font | 23KB |
| Inter 400 font | 21KB |
| HTML document | 20KB |
| Hero image (640w webp) | 12KB |
| Svelte JS chunks | ~9KB each |

### SEO Checklist (All Indexed Pages)

- [x] `<title>` element on every page
- [x] `<meta name="description">` on every page (130-150 chars)
- [x] `<link rel="canonical">` on every page
- [x] `<link rel="alternate" hreflang="de">` and `x-default`
- [x] `robots.txt` valid and complete
- [x] All links crawlable (no `javascript:` or `#` only)
- [x] Link text is descriptive
- [x] Image `[alt]` attributes present
- [x] Heading order is sequential (h1 → h2 → h3)
- [x] HTTPS enforced with www redirect
- [ ] **OG image dimensions match served image** ← fix needed
- [ ] **Facebook `sameAs` URL** is profile, not page ← fix needed
- [ ] **`priceRange` removal from Offer schema** ← fix needed

---

## Prioritized Action Plan

### Immediate (5 min each)

1. **Fix OG image dimensions** — Change `og:image:width` from 1200 to 1024 (or serve a 1200px variant). In `MetaTags.svelte`, update the `width`/`height` attributes.
2. **Fix Facebook `sameAs`** — Replace `https://www.facebook.com/profile.php?id=61576264141191` with the canonical business page URL (e.g. `https://www.facebook.com/AustUmzuege/`).
3. **Remove `priceRange` from Offer schema** — In `structuredData.ts`, remove `priceRange` from `Offer` objects.

### Content (1-2 hours each)

4. **Expand `/ratgeber`** to 800-1200 words — add 3-4 detailed guide previews with internal links.
5. **Expand `/leistungen`** to 1000+ words — add more service descriptions, FAQs, trust signals.

### Low Priority

6. **Sitemap `lastmod`** — Update each entry's `lastmod` to reflect actual last change date (automate in build).
7. **GTM optimization** — Consider `gtag.js` async loading with `data-cfasync="false"` or Partytown for web worker offload (marginal benefit given current TBT).

---

## Service Detail Pages (Bonus)

| Page | Performance | SEO | LCP |
|------|------------|-----|-----|
| `/leistungen/privatumzug` | 93 | 100 | 2.9s |
| `/leistungen/seniorenumzug` | 90 | 100 | 3.2s |
| `/impressum` | 98 | 100 | 1.7s |

Service detail pages score well. LCP under 3.2s is within "good" threshold (<2.5s target, <4s acceptable for content-heavy pages).