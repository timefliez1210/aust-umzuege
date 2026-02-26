# SEO Domination Plan: Outrank All Hildesheim Competitors

**Created:** 2026-02-26
**Status:** Planning — implementation pending
**Current SEO Score:** 84/100 (nearest competitor Dünnebeil: 58/100)
**Goal:** Grow from 22 → 51+ pages, dominate all service and geographic keywords

---

## Phase 1: Technical Fixes (Week 1) — ~4 hours

### 1.1 Add Twitter Card meta tags
- **File:** `src/lib/components/MetaTags.svelte`
- Add `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` — reuses existing props
- Affects all 22 pages (single component change)

### 1.2 Shorten homepage H1
- **File:** `src/lib/components/Hero.svelte` (default `heading` prop, currently 94 chars)
- Shorten to ~42 chars: "Umzugsunternehmen Hildesheim – Festpreis"
- Move detail to `subheading`

### 1.3 Fix sameAs social URLs in schema
- **File:** `src/lib/data/structuredData.ts` (line ~143)
- Replace Facebook share link with actual business page URL
- Fix Instagram/TikTok to canonical forms (add `www.`, trailing `/`)

### 1.4 Fix priceRange on Offer schema
- **File:** `src/lib/data/structuredData.ts` (all 9 service `offers` blocks)
- Remove `priceRange: "€€"` from Offer types (invalid — already correct on businessInfo)
- For services with known ranges, convert to `AggregateOffer` with `lowPrice`/`highPrice`

### 1.5 Add AI crawler directives to robots.txt
- **File:** `static/robots.txt`
- Add explicit `Allow: /` for GPTBot, Google-Extended, ChatGPT-User, ClaudeBot, PerplexityBot

### 1.6 De-orphan conversion pages
- Add body-content links to `/kostenloses-angebot` from 4 ratgeber articles
- Add outbound links from `/kontakt` to `/kostenloses-angebot`, `/leistungen`, `/ratgeber`

### 1.7 Boost fern-ueberseeumzug inbound links
- Add contextual body links from `privatumzug` and `firmenumzug` pages

---

## Phase 2: Strengthen Existing Pages (Week 2–3) — ~12 hours

### 2.1 Add FAQ sections to all 4 ratgeber articles
- **Files:** All 4 `src/routes/ratgeber/*/+page.svelte`
- **Reuse:** `FAQSection.svelte` (same pattern as service pages — auto-generates FAQPage JSON-LD)
- 5 Q&As per article, targeting long-tail search queries:
  - **Checkliste:** "Wie lange vorher planen?", "Was wird am häufigsten vergessen?", "Muss ich mich ummelden?", "Wie viele Kartons brauche ich?", "Nachsendeantrag online stellen?"
  - **Verpackungstipps:** "Wie verpacke ich Gläser?", "Wie schwer darf ein Karton sein?", "Wo bekomme ich günstige Kartons?", "Fernseher verpacken?", "Bücherkartons oder normale?"
  - **Haushaltsauflösung:** "Was kostet eine Haushaltsauflösung?", "Wie lange dauert eine Räumung?", "Wer entsorgt Sondermüll?", "Teile selbst machen?", "Auflösung oder Entrümpelung?"
  - **Seriöse Umzugsfirma:** "Unseriöse Firmen erkennen?", "Was kostet ein professioneller Umzug?", "Billigsten Anbieter nehmen?", "Festpreis vs. Kostenvoranschlag?", "Wie viele Angebote einholen?"

### 2.2 Build service↔ratgeber cross-link network
- **Files:** All 10 service pages under `src/routes/leistungen/*/+page.svelte`
- Currently ZERO service pages link to any ratgeber article — add 12+ contextual body links:

| Service Page | Links to Ratgeber | Where in content |
|---|---|---|
| privatumzug | umzugs-checkliste + verpackungstipps | "So läuft Ihr Umzug ab" section |
| firmenumzug | seriose-umzugsfirma | Quality comparison section |
| seniorenumzug | umzugs-checkliste + haushaltsaufloesungen | Planning + combined service section |
| haushaltsaufloesung | haushaltsaufloesungen-entruempelungen | End of intro |
| umzugshelfer | verpackungstipps | DIY packing context |
| montage | verpackungstipps | Furniture preparation context |
| lagerung | umzugs-checkliste | Timeline planning context |
| umzugsberatung | seriose-umzugsfirma | Trust-building context |
| halteverbot | umzugs-checkliste | "2 Wochen vorher" context |
| fern-ueberseeumzug | verpackungstipps | International packing standards |

### 2.3 Enrich hub pages
- **`src/routes/leistungen/+page.svelte`** (~600 words → 1,500+ words)
  - Add "Warum Aust Umzüge" trust section (5.0 stars, 69 reviews, Festpreis)
  - Add FAQ section (5–7 general service FAQs using FAQSection component)
  - Add "Unser Servicegebiet" section mentioning all cities
- **`src/routes/ratgeber/+page.svelte`** (~450 words → 1,200+ words)
  - Add expert intro positioning Aust as local moving authority
  - Add "Meistgelesene Tipps" highlight section
  - Add FAQ section (5 general moving questions)
  - Add CTA linking to `/kostenloses-angebot`

### 2.4 Add `<article>` wrapper to service pages
- **Files:** All 10 service pages (ratgeber already have `<article>`)
- Wrap main content in `<article>` for semantic AI-readability

---

## Phase 3: City Landing Pages (Month 1–2) — ~35 hours

Dünnebeil's 13 city pages are their only structural advantage. We match and exceed them.

### 3.1 Create city page template
- Either new reusable component or follow inline pattern from privatumzug
- Reuses: MetaTags, FAQSection, StructuredData, Hero components
- Props: city name, distance, neighborhoods, intro, local knowledge, FAQs
- Schema: Service + areaServed (city-specific) + FAQPage + BreadcrumbList

### 3.2 Primary geo page: Umzug Hildesheim
- **New route:** `src/routes/leistungen/umzug-hildesheim/+page.svelte`
- **Keywords:** "Umzug Hildesheim", "Umzugsfirma Hildesheim", "Umzugsunternehmen Hildesheim"
- 3,000–4,000 words: all services overview, Hildesheim neighborhoods (Nordstadt, Oststadt, Moritzberg, Ochtersum, Itzum, Marienburger Höhe, Himmelsthür, Drispenstedt), pricing section, 7 FAQs
- Heavy cross-links to all service pages + `/kostenloses-angebot`

### 3.3 Six surrounding city pages
Each: 2,000–3,500 words, 7 FAQs, Service schema with city-specific areaServed

| Route | Target Keywords | Angle |
|-------|----------------|-------|
| `/leistungen/umzug-hannover` | Umzug Hannover, Umzugsfirma Hannover | A7 corridor, 30 km, university/corporate moves |
| `/leistungen/umzug-braunschweig` | Umzug Braunschweig | Student/corporate moves, TU Braunschweig |
| `/leistungen/umzug-salzgitter` | Umzug Salzgitter | 20 km proximity, industrial area |
| `/leistungen/umzug-peine` | Umzug Peine | Short distance, cost-effective |
| `/leistungen/umzug-goslar` | Umzug Goslar | Harz region, historic Altstadt challenges |
| `/leistungen/umzug-alfeld` | Umzug Alfeld (Leine) | Nearby small-town, quick response |

### 3.4 Integration updates
- **`src/lib/data/structuredData.ts`** — expand `areaServed` array, add city service schemas
- **`static/sitemap.xml`** — add all 7 new URLs
- **`src/routes/leistungen/+page.svelte`** — add "Umzug in Ihrer Stadt" section
- **`src/lib/components/Navbar.svelte`** — add city pages sub-group in Leistungen dropdown
- **`static/llms.txt` + `llms-full.txt`** — add city service descriptions

---

## Phase 4: Niche Services + New Ratgeber (Month 2–3) — ~25 hours

### 4.1 New niche service pages
Each follows established service page pattern (Hero, 6-step process, FAQ, CTA, schema).

| Route | Keywords | Why |
|-------|----------|-----|
| `/leistungen/umzugskosten` | "Umzugskosten Hildesheim", "Was kostet ein Umzug" | High-volume cost research, heavy CTA to /kostenloses-angebot |
| `/leistungen/studentenumzug` | "Studentenumzug Hildesheim", "günstiger Umzug Studenten" | Uncovered by all competitors, seasonal peak |
| `/leistungen/sozialumzug` | "Hartz 4 Umzug", "Bürgergeld Umzug", "Sozialumzug" | Only Balu covers this — steal with better content |
| `/leistungen/klaviertransport` | "Klaviertransport Hildesheim", "Schwertransport Umzug" | Specialized niche, zero competition |

### 4.2 New ratgeber articles
Each: 2,500–3,500 words, Article + HowTo schema, FAQSection (5–7 Qs), cross-links to service pages.

| Route | Keywords |
|-------|----------|
| `/ratgeber/umzugskosten-sparen` | "Umzugskosten sparen", "günstig umziehen" |
| `/ratgeber/umzug-mit-kindern` | "Umzug mit Kindern", "Schulwechsel Umzug" |
| `/ratgeber/behoerden-checkliste` | "Ummeldung nach Umzug", "Behörden Checkliste" |
| `/ratgeber/umzug-versicherung` | "Umzugsversicherung", "Transportversicherung" |

### 4.3 Schema + sitemap updates
- Add all 8 new pages to `structuredData.ts`
- Update `sitemap.xml`, `llms.txt`, Navbar, RatgeberTeaser component

---

## Phase 5: Authority & Trust Signals (Month 3–4) — ~12 hours

### 5.1 "Über uns" team page
- **New route:** `src/routes/ueber-uns/+page.svelte`
- **Keywords:** "Aust Umzüge Team", "Umzugsfirma Hildesheim"
- Content: Founder story (Alex Aust), team photos, timeline, values, Check24 badge, service area
- Schema: AboutPage + Person

### 5.2 Bewertungen page
- **New route:** `src/routes/bewertungen/+page.svelte`
- **Keywords:** "Aust Umzüge Bewertungen", "Umzugsfirma Hildesheim Erfahrungen"
- Full ReviewsSection display, aggregate rating, Google Maps link, CTAs

### 5.3 Enhance footer with site-wide links
- **File:** `src/lib/components/Footer.svelte`
- Add "Leistungen" and "Ratgeber" link columns for improved PageRank distribution

### 5.4 Add "Über uns" to navigation
- **File:** `src/lib/components/Navbar.svelte`

---

## Phase 6: Ongoing Growth (Month 4–6) — ~5 hrs/month

### 6.1 Monthly ratgeber articles (1 per month minimum)

| Month | Topic | Keywords | Route |
|-------|-------|----------|-------|
| 4 | Entrümpeln vor dem Umzug | "Ausmisten vor Umzug" | `/ratgeber/entruempeln-vor-umzug` |
| 4 | Umzug Steuer absetzen | "Umzugskosten Steuererklärung" | `/ratgeber/umzug-steuer-absetzen` |
| 5 | Umzug mit Haustieren | "Umzug mit Hund/Katze" | `/ratgeber/umzug-mit-haustieren` |
| 5 | Messie-Wohnung räumen | "Messie Haushaltsauflösung" | `/ratgeber/messie-wohnung-raeumen` |
| 6 | Umzug im Winter | "Umzug Winter Tipps" | `/ratgeber/umzug-im-winter` |
| 6 | Erste eigene Wohnung | "Erste Wohnung Checkliste" | `/ratgeber/erste-eigene-wohnung` |

### 6.2 Second wave city pages (smaller towns, near-zero competition)
- `/leistungen/umzug-sarstedt`
- `/leistungen/umzug-bad-salzdetfurth`
- `/leistungen/umzug-bockenem`
- `/leistungen/umzug-elze`
- `/leistungen/umzug-nordstemmen`
- `/leistungen/umzug-giesen`

### 6.3 Content freshness
- Update review count in structuredData.ts as new Google reviews come in (currently 69)
- Update `dateModified` + sitemap `lastmod` when content changes
- Refresh pricing data annually

---

## Page Count Progression

| Milestone | Pages | vs. Dünnebeil (47) | Keyword Coverage |
|-----------|-------|--------------------|------------------|
| Current | 22 | Behind on volume | 10 service + 4 ratgeber |
| After Phase 1–2 | 22 (stronger) | Quality gap widening | Same pages, better signals |
| After Phase 3 | 29 | City page parity | +7 geographic keywords |
| After Phase 4 | 37 | Surpassing niche coverage | +4 niche + 4 informational |
| After Phase 5 | 39 | Authority parity | +2 trust/authority pages |
| After Phase 6 | 51+ | **Market leader** | +6 cities + 6 ratgeber |

---

## Key Files Reference

| File | Role |
|------|------|
| `src/lib/components/MetaTags.svelte` | Meta tags for all pages (add Twitter Cards here) |
| `src/lib/components/FAQSection.svelte` | Reusable FAQ + auto FAQPage JSON-LD |
| `src/lib/components/StructuredData.svelte` | Generic JSON-LD renderer |
| `src/lib/data/structuredData.ts` | Central schema definitions (785 lines) |
| `src/lib/components/Hero.svelte` | Responsive hero with H1 + CTA |
| `src/lib/components/ReviewsSection.svelte` | Google reviews carousel |
| `src/lib/components/Footer.svelte` | Site-wide footer (add link columns) |
| `src/lib/components/Navbar.svelte` | Navigation (add city pages + Über uns) |
| `static/sitemap.xml` | Manual sitemap (add all new URLs) |
| `static/robots.txt` | Crawler directives (add AI bots) |
| `static/llms.txt` + `llms-full.txt` | AI search readiness files |

---

## Competitor Quick Reference

| Competitor | Score | Pages | Biggest Weakness |
|------------|-------|-------|-----------------|
| **Aust (us)** | **84** | **22** | Volume, missing city pages |
| Dünnebeil | 58 | 47 | No schema, WordPress bloat, thin city pages |
| ADS GmbH | 52 | 17 | No blog, stale sitemap, schema errors |
| Express Umzug | 47 | 7 | Tiny footprint, broken schema |
| Hildesheimer Dienste | ~45 | ~6 | Website builder, no content |
| ZAI Umzuege | 42 | 17 | Stale since 2023, Elementor bloat |
| Balu | ~40 | ~12 | No schema, no reviews, poor titles |

---

*Plan created 2026-02-26. To implement, start with Phase 1 technical fixes and work through phases sequentially.*
