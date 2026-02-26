# Full SEO Audit Report: www.aust-umzuege.de

**Date:** 2026-02-26 | **Business:** Aust Umzuege und Haushaltsaufloesungen (Moving Company, Hildesheim) | **Pages:** 22 indexable URLs

---

## SEO Health Score: 84 / 100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Technical SEO | 93/100 | 25% | 23.3 |
| Content Quality | 82/100 | 25% | 20.5 |
| On-Page SEO | 76/100 | 20% | 15.2 |
| Schema / Structured Data | 82/100 | 10% | 8.2 |
| Performance (CWV) | 92/100 | 10% | 9.2 |
| Images | 72/100 | 5% | 3.6 |
| AI Search Readiness | 83/100 | 5% | 4.2 |
| **Total** | | **100%** | **84.2** |

**Rating: Very Good** — The site is well above average for a local service business. Technical foundations are excellent. The main opportunities are in content expansion, deployment sync, and a few schema fixes.

---

## Top 5 Critical Issues

| # | Issue | Category | Impact |
|---|-------|----------|--------|
| 1 | **Live meta descriptions don't match source code** — at least 6 pages show truncated descriptions (44-85 chars vs 130-150 in source). Site needs a rebuild + deploy. | On-Page | Major SERP real estate loss |
| 2 | **Homepage H1 too long** (94 chars) — should be under 60 | On-Page | Keyword dilution |
| 3 | **No LCP hero image `<link rel="preload">`** in `<head>` | Images/CWV | LCP delay |
| 4 | **OG image dimensions mismatch** — declares 1200x630 but serves 1024w variant | Images | Broken social previews |
| 5 | **Facebook `sameAs` URL is a share link**, not the business page URL | Schema | Invalid entity signal |

## Top 5 Quick Wins

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | **Rebuild & redeploy** (`npm run build && python3 inline-css.py && python3 deploy-full.py`) to sync meta descriptions | 5 min | High |
| 2 | **Add Twitter Card meta tags** to MetaTags component | 15 min | Medium |
| 3 | **Fix social `sameAs` URLs** (Facebook, Instagram, TikTok canonical forms) | 10 min | Medium |
| 4 | **Remove `priceRange` from Offer objects** in structuredData.ts | 10 min | Medium |
| 5 | **Add explicit AI crawler directives** to robots.txt | 10 min | Low-Medium |

---

## Detailed Findings by Category

### 1. Technical SEO — 93/100

**Strengths:**
- Robots.txt and sitemap are complete and correctly configured — all 22 public URLs present, all excluded routes properly blocked
- Canonical tags, hreflang (`de` + `x-default`), and meta robots are correctly set on every page
- Full security header suite: HSTS (with preload), X-Frame-Options, CSP, COOP, nosniff, Referrer-Policy, Permissions-Policy
- HTTPS enforcement with www normalization via 301 redirects
- Trailing slash stripping via .htaccess
- Excellent caching strategy (1yr immutable for hashed assets/fonts, 6mo images, 1hr HTML)
- Gzip compression enabled for all key content types
- Pre-rendered static HTML — works fully without JavaScript

**Issues:**
- **[MEDIUM]** All sitemap `lastmod` dates are identical (2026-02-26) — reduces crawl priority signals
- **[MEDIUM]** Double redirect chain from `http://aust-umzuege.de/` (2 hops due to hosting-level HTTPS redirect before .htaccess)
- **[MEDIUM]** `'unsafe-inline'` in CSP `script-src` — required for GA and SvelteKit, pragmatic tradeoff on shared hosting
- **[LOW]** No Twitter Card meta tags
- **[LOW]** `changefreq` in sitemap is deprecated (Google ignores it)

---

### 2. Content Quality — 82/100

**Strengths:**
- Service detail pages (privatumzug, seniorenumzug) are excellent: 1,800-2,300 words, comprehensive FAQ sections, specific pricing, local expertise
- Strong E-E-A-T signals: 69 Google reviews at 5.0 stars, Check24 Profi seit 2019, founder named, physical address, Pflegekasse subsidy details
- Clear keyword strategy with no cannibalization — each page targets distinct keywords
- Multiple CTAs on every page (hero CTA, sticky sidebar, section CTAs, form links)
- Interactive volume calculator on the quote page adds unique engagement value

**Issues:**
- **[HIGH]** Hub pages are thin: `/ratgeber` (~450 words), `/leistungen` (~600 words) — should be 800-1,200 words
- **[MEDIUM]** No images in service detail page content areas — reduces engagement and image search visibility
- **[MEDIUM]** Only 4 ratgeber articles — expanding the content cluster (e.g., "Umzug mit Kindern", "Umzugskosten sparen") would strengthen topical authority
- **[LOW]** No visible author bylines on content pages (Alex Aust is in schema but not displayed)
- **[LOW]** Generic "Details" anchor text on leistungen overview cards

---

### 3. On-Page SEO — 76/100

**Strengths:**
- Title tags are well-optimized (50-60 chars, keyword-first, brand appended)
- Meta descriptions in source code are strong (130-150 chars, CTAs, USPs)
- Clean heading hierarchy (H1 > H2 > H3) on all pages
- Canonical URLs correctly set everywhere
- Good internal linking network across service and guide pages

**Issues:**
- **[CRITICAL]** Live meta descriptions don't match source code on 6+ pages. The deployed build is stale.
- **[HIGH]** Homepage H1 is 94 characters: "Professionell & kompetent - Ihr Umzugsunternehmen in Hildesheim - Umzuege, Haushaltsaufloesungen & Montagen" — should be shortened to ~40-60 chars
- **[MEDIUM]** No `article:published_time`, `article:modified_time`, or `article:author` OG tags on article pages
- **[MEDIUM]** Residual Netlify form attributes (`data-netlify`, `netlify-honeypot`) on contact forms — non-functional on Apache hosting

---

### 4. Schema / Structured Data — 82/100

**Strengths:**
- Uses the exact `MovingCompany` Schema.org type (most specific subtype)
- Centralized, type-safe schema management via `structuredData.ts`
- Comprehensive coverage: MovingCompany, WebSite, BreadcrumbList, Service (x10), FAQPage (x10), Article (x4), HowTo (x4), ItemList, AggregateRating, Review (x6), ContactPage, WebPage
- Proper `@id` referencing for entity linking across pages
- FAQSection component auto-generates FAQPage schema — zero-effort FAQ markup

**Issues:**
- **[HIGH]** `sameAs` Facebook URL is a share link (`/share/16MwCMuiwd/`), not the business page
- **[HIGH]** `priceRange` used on `Offer` type (belongs on `LocalBusiness`, not `Offer`)
- **[HIGH]** Instagram/TikTok `sameAs` URLs use non-canonical forms (missing `www.` and trailing `/`)
- **[MEDIUM]** Logo dimensions in schema (150x150) likely don't match actual image dimensions
- **[MEDIUM]** Homepage BreadcrumbList has only one item with no URL — semantically unnecessary
- **[MEDIUM]** Perfect 5.0 rating with 69 reviews may trigger Google spam filters
- **[LOW]** Missing `contactPoint`, `hasOfferCatalog` on MovingCompany
- **[LOW]** No `@graph` pattern for connected entities (separate script tags work but are less optimal)

---

### 5. Images — 72/100

**Strengths:**
- All images use WebP format exclusively — no unoptimized JPG/PNG
- Responsive `srcset` + `sizes` on hero, about, and carousel images with correct breakpoints
- Proper lazy loading: `loading="eager"` + `fetchpriority="high"` on hero; `loading="lazy"` on below-fold images
- All images have explicit `width`/`height` attributes — zero CLS from images
- Descriptive, keyword-rich German filenames with location keywords

**Issues:**
- **[CRITICAL]** No `<link rel="preload">` for the hero LCP image in `<head>` — the `fetchpriority="high"` on the `<img>` helps but a preload hint would start the download earlier
- **[HIGH]** OG image dimensions mismatch: declares 1200x630 but uses 1024w hero variant
- **[HIGH]** No Twitter Card meta tags (`twitter:card`, `twitter:image`)
- **[MEDIUM]** No AVIF format support — 20-50% smaller than WebP at equivalent quality
- **[MEDIUM]** No `<picture>` elements for format fallback (AVIF > WebP)
- **[MEDIUM]** No image entries in sitemap.xml
- **[LOW]** Inconsistent filename casing (`Haushaltsaufloesungen-...` vs lowercase convention; `LogoName_transparent` vs kebab-case)

---

### 6. AI Search Readiness — 83/100

**Strengths:**
- `llms.txt` and `llms-full.txt` both exist and are well-structured — rare among local businesses
- Entity clarity is perfect (10/10): MovingCompany schema, full address, geo, services, social, VAT ID
- Highly citable content: specific price ranges, duration estimates, Pflegekasse subsidy amounts, tax deduction info
- FAQPage schemas on all 10 service pages — excellent for AI extraction
- Referenced in robots.txt with comment directives

**Issues:**
- **[HIGH]** Guide/service pages lack `<article>` semantic wrapper — hurts AI content classification
- **[MEDIUM]** No explicit AI crawler directives in robots.txt (GPTBot, ClaudeBot, etc.)
- **[MEDIUM]** No visible author bylines on Ratgeber articles — weakens E-E-A-T for AI
- **[MEDIUM]** No team/about page with credentials
- **[LOW]** FAQ uses CSS toggle rather than native `<details>/<summary>` elements
- **[LOW]** No `<table>` elements for comparative data (pricing tiers, timeline comparison)

---

## Prioritized Action Plan

### Critical — Fix Immediately
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 1 | **Rebuild & redeploy** to sync live meta descriptions with source | Terminal | 5 min |
| 2 | **Shorten homepage H1** to ~40-60 chars (e.g., "Ihr Umzugsunternehmen in Hildesheim") | `src/lib/components/Hero.svelte` | 15 min |

### High — Fix Within 1 Week
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 3 | **Fix `sameAs` social URLs** — use canonical Facebook page URL, add `www.` to Instagram/TikTok | `src/lib/data/structuredData.ts` | 10 min |
| 4 | **Add Twitter Card meta tags** | `src/lib/components/MetaTags.svelte` | 15 min |
| 5 | **Remove `priceRange` from Offer objects** | `src/lib/data/structuredData.ts` | 10 min |
| 6 | **Fix OG image** — create dedicated 1200x630 OG image or fix declared dimensions | `MetaTags.svelte`, `+layout.svelte` | 30 min |
| 7 | **Add `<link rel="preload">` for hero LCP image** | `src/app.html` or `Hero.svelte` | 15 min |

### Medium — Fix Within 1 Month
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 8 | Expand `/ratgeber` hub page to 800+ words | `src/routes/ratgeber/+page.svelte` | 1-2 hr |
| 9 | Expand `/leistungen` hub page to 800+ words | `src/routes/leistungen/+page.svelte` | 1-2 hr |
| 10 | Add `<article>` wrapper to service/guide detail pages | Multiple route files | 1 hr |
| 11 | Add explicit AI crawler directives to robots.txt | `static/robots.txt` | 15 min |
| 12 | Update sitemap `lastmod` dates to actual modification dates | `static/sitemap.xml` | 30 min |
| 13 | Add `article:published_time` and `article:author` OG tags | `MetaTags.svelte` | 30 min |
| 14 | Generate AVIF image variants + add `<picture>` elements | Image pipeline + components | 2-3 hr |
| 15 | Fix logo dimensions in schema (verify actual size) | `structuredData.ts` | 10 min |
| 16 | Remove single-item homepage BreadcrumbList | `src/routes/+page.svelte` | 5 min |
| 17 | Add images to sitemap.xml | `static/sitemap.xml` | 30 min |
| 18 | Add visible author bylines to Ratgeber articles | Ratgeber route files | 30 min |

### Low — Backlog
| # | Action | Effort |
|---|--------|--------|
| 19 | Add `contactPoint` to MovingCompany schema | 15 min |
| 20 | Remove residual Netlify form attributes | 10 min |
| 21 | Replace generic "Details" anchor text on leistungen cards | 15 min |
| 22 | Add more Ratgeber articles (topical authority) | 2-4 hr each |
| 23 | Consider `@graph` pattern for structured data | 1-2 hr |
| 24 | Add `text/plain` to .htaccess gzip rules | 5 min |
| 25 | Normalize image filenames (casing consistency) | 30 min |

---

*Report generated by seo-audit skill with 5 parallel specialist subagents. Audit date: 2026-02-26.*
