# Admin Dashboard

Internal operations panel for Aust Umzuege. This is a fully client-side single-page application (SPA) embedded within the SvelteKit project, built for staff to manage quotes, offers, customers, emails, and calendar bookings.

It is completely separate from the public website. It is never prerendered, never indexed by search engines, and is protected by JWT authentication.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)
6. [Authentication Flow](#authentication-flow)
7. [Pages Overview](#pages-overview)
8. [Components](#components)
9. [Utilities](#utilities)
10. [Design System](#design-system)
11. [API Integration](#api-integration)
12. [Conventions](#conventions)

---

## Overview

The admin dashboard provides internal tooling for the Aust Umzuege moving company. It is intended for use by company staff and administrators only.

Primary capabilities:

- Receiving and managing incoming move quote requests
- Generating and tracking customer offers (with PDF download/send)
- Viewing the customer directory and linked activity
- Managing the booking calendar with capacity controls
- Reading and composing email threads (with LLM-assisted drafting)
- User account management and role assignment

The dashboard is accessed at `/admin` and is excluded from the public sitemap, robots.txt, and all SEO metadata (`noindex, nofollow`).

---

## Architecture

```
Public Website (prerendered, SSG)
    └── src/routes/  (excl. admin/)

Admin Dashboard (SPA, client-side only)
    └── src/routes/admin/
```

Key architectural decisions:

- **Client-side only**: `ssr: false` and `prerender: false` are set on the admin layout. No server-side rendering occurs.
- **SPA fallback**: `svelte.config.js` sets `fallback: 'admin.html'` so Apache serves the SPA shell for all `/admin/*` routes on the KAS shared host.
- **JWT authentication**: Access and refresh tokens are stored in `localStorage`. Every API request injects the token via `Authorization: Bearer <token>`.
- **REST API backend**: All data is fetched from `https://api.aufraeumhelden.com`. The API base URL is configurable via the `VITE_API_BASE` environment variable.
- **Layout guard**: The admin layout (`+layout.svelte`) uses a Svelte 5 `$effect` to redirect unauthenticated users to `/admin/login` before any page renders.
- **No shared state with public site**: The admin module does not share stores, components, or styles with the public website beyond what is explicitly imported.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit (adapter-static) |
| Language | TypeScript |
| Reactivity | Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) |
| Icons | lucide-svelte |
| Mapping | Leaflet (in RouteMap component) |
| Auth | JWT (access + refresh token pair) |
| API | REST, JSON, `fetch()` |
| Hosting | KAS shared hosting (Apache) |
| Deployment | FTP via `deploy-full.py` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- `npm install` completed at the project root

### Running locally

```bash
npm run dev
```

Navigate to `http://localhost:5173/admin` in your browser. You will be redirected to the login page if not authenticated.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE` | `https://api.aufraeumhelden.com` | REST API base URL |

To override for local development, create a `.env` file at the project root:

```
VITE_API_BASE=https://api.aufraeumhelden.com
```

### Building

```bash
npm run build
```

The admin SPA is built as part of the standard SvelteKit static build. The SPA shell is output as `build/admin.html` and referenced by `.htaccess` for client-side routing fallback.

---

## Project Structure

```
src/
├── routes/
│   └── admin/
│       ├── +layout.svelte          # Auth guard, shell layout (sidebar + topbar + Toast)
│       ├── +page.svelte            # Dashboard — KPI cards, recent activity, conflict alerts
│       ├── login/
│       │   └── +page.svelte        # Login form (renders without sidebar)
│       ├── quotes/
│       │   ├── +page.svelte        # Quote list with search/filter, create form
│       │   └── [id]/
│       │       └── +page.svelte    # Quote detail — items, estimation, pricing, map, photos
│       ├── offers/
│       │   ├── +page.svelte        # Offer list with status tabs
│       │   └── [id]/
│       │       └── +page.svelte    # Offer detail — PDF, line item editor, price calculator
│       ├── customers/
│       │   ├── +page.svelte        # Customer directory + create form
│       │   └── [id]/
│       │       └── +page.svelte    # Customer detail with linked quotes and offers
│       ├── emails/
│       │   ├── +page.svelte        # Email thread list + compose form
│       │   └── [id]/
│       │       └── +page.svelte    # Thread detail with draft management
│       ├── calendar/
│       │   └── +page.svelte        # Monthly calendar — bookings, capacity, day modal
│       ├── settings/
│       │   └── +page.svelte        # User management, password change, role assignment
│       ├── CLAUDE.md               # Internal developer reference (API endpoints, data models)
│       └── README.md               # This file
│
├── lib/
│   ├── components/
│   │   └── admin/
│   │       ├── Sidebar.svelte      # Navigation sidebar
│   │       ├── DataTable.svelte    # Sortable, clickable data table
│   │       ├── StatusBadge.svelte  # Color-coded status indicator
│   │       ├── PriceInput.svelte   # Brutto/netto price input with VAT
│   │       ├── RouteMap.svelte     # Leaflet map with route polyline
│   │       ├── Toast.svelte        # Toast notification system
│   │       └── ImageLightbox.svelte # Full-size image overlay with bbox visualization
│   │
│   ├── stores/
│   │   └── auth.svelte.ts          # Auth state — token, user, login, logout, refresh
│   │
│   └── utils/
│       ├── api.svelte.ts           # API client (apiFetch, apiGet, apiPost, etc.)
│       ├── format.ts               # formatEuro, formatDate, formatDateTime
│       ├── pricing.ts              # Labor cost, VAT, line item calculations
│       ├── calendar.ts             # Calendar grid builder, day/schedule types
│       ├── sorting.ts              # Generic sort + photo-index filter
│       ├── volume.ts               # Total volume computation from item list
│       └── floor.ts                # Floor label/parse helpers (German floor names)
│
└── styles/
    └── admin.css                   # CSS custom properties (design tokens)
```

---

## Authentication Flow

### Token storage

Tokens are stored in `localStorage` under the following keys:

| Key | Contents |
|---|---|
| `aust_access_token` | JWT access token (short-lived) |
| `aust_refresh_token` | Refresh token (long-lived) |
| `aust_user` | Decoded user object `{ email, name, role }` |

### Step-by-step flow

1. **Login**: The user submits credentials to `POST /api/v1/auth/login`. On success, the `access_token` and `refresh_token` are stored in `localStorage`. The JWT payload is decoded client-side to extract `email`, `name`, and `role` without an additional round-trip.

2. **Request injection**: Every call through `apiFetch()` reads `auth.token` from the `AuthStore` and injects `Authorization: Bearer <token>` into the request headers.

3. **Automatic token refresh**: If a request returns `401 Unauthorized`, `apiFetch()` automatically calls `auth.refreshToken()` which hits `POST /api/v1/auth/refresh`. If the refresh succeeds, the original request is retried with the new token. If the refresh fails, `auth.logout()` is called and the user is redirected to `/admin/login`.

4. **Route guard**: The admin layout watches `auth.isAuthenticated` (a `$derived` boolean from `auth.token`) via `$effect`. Any navigation to a non-login admin route while unauthenticated triggers an immediate redirect to `/admin/login`.

5. **Logout**: `auth.logout()` clears `token`, `user`, and `error` from the store and removes all three `localStorage` keys. The layout's logout button then navigates to `/admin/login`.

```
User submits credentials
        |
        v
POST /api/v1/auth/login
        |
   success?  --no--> show error message
        |
       yes
        |
        v
Store access_token + refresh_token in localStorage
Decode JWT payload -> store user (email, name, role)
        |
        v
Navigate to /admin (dashboard)
        |
        v
Each apiFetch() call:
  Inject Authorization: Bearer <access_token>
        |
   returns 401? --yes--> POST /api/v1/auth/refresh
        |                       |
        no                 success? --no--> logout() + redirect /admin/login
        |                       |
        v                      yes
  Handle response         Retry original request with new token
```

---

## Pages Overview

| Route | Label (German) | Description |
|---|---|---|
| `/admin` | Dashboard | KPI summary cards (open quotes, pending offers, today's bookings, total customers), recent activity feed, overbooked calendar date alerts |
| `/admin/login` | Anmelden | Standalone login form; renders without the sidebar layout |
| `/admin/quotes` | Anfragen | Paginated, searchable quote list; inline create form supporting manual volume entry, photo upload, and video upload modes |
| `/admin/quotes/[id]` | Anfrage Detail | Full quote view: furniture item estimation table, total volume, preferred date, route map, photo/video upload trigger, photo review lightbox with bounding boxes, offer generation |
| `/admin/offers` | Angebote | Offer list filterable by status tabs (Entwurf, Versendet, Angenommen, Abgelehnt) |
| `/admin/offers/[id]` | Angebot Detail | Offer detail: PDF download via `apiDownload()`, line item editor, labor/VAT price calculator, regenerate and send actions |
| `/admin/customers` | Kunden | Searchable customer directory with inline create form |
| `/admin/customers/[id]` | Kunde Detail | Customer profile with linked quotes and offers |
| `/admin/emails` | E-Mails | Email thread list with search and compose form |
| `/admin/emails/[id]` | E-Mail Thread | Thread view with message history, draft body editing, LLM regeneration, send and discard actions |
| `/admin/calendar` | Kalender | Monthly grid calendar (Monday-first). Click any day to open a modal showing bookings, capacity override editor, and a create booking form. Dashboard surfaces overbooked days. |
| `/admin/settings` | Einstellungen | User list, create user form (name, email, password, role), delete user, change own password |

---

## Components

All reusable admin components live in `src/lib/components/admin/`.

| Component | Description |
|---|---|
| `Sidebar.svelte` | Fixed left navigation sidebar. On desktop: collapsible to icon-only mode (240px expanded, 64px collapsed). On mobile (≤768px): off-canvas drawer with slide-in animation triggered by the topbar hamburger button. Active link highlighted with indigo tint. |
| `DataTable.svelte` | Generic sortable table. Accepts column definitions and row data. Clicking a column header toggles sort direction. Clicking a row emits a row-click event. Shows an empty-state slot when there are no rows. Horizontally scrollable on narrow viewports. |
| `StatusBadge.svelte` | Pill-shaped badge for rendering status strings. Covers 20+ status values (e.g. `open`, `accepted`, `sent`, `confirmed`, `cancelled`, `paid`, `done`) with distinct color mappings. |
| `PriceInput.svelte` | Currency input with a Brutto/Netto toggle. Entering a netto value automatically computes the 19% VAT brutto amount and vice versa. Emits both netto and brutto values in cents. |
| `RouteMap.svelte` | Leaflet-based map rendered in a bounded container. Displays a polyline for the move route, distinct start and end markers, and a distance/duration badge. Accepts an array of route leg geometries from the distance API. |
| `Toast.svelte` | Application-wide notification layer. Rendered once in the admin layout. Exposes a `showToast(message, type)` export function (`'success'`, `'error'`, `'info'`). Notifications auto-dismiss after 4 seconds and can also be manually closed. |
| `ImageLightbox.svelte` | Full-screen overlay for reviewing estimation photos. Displays the source image at full size and overlays bounding box annotations from the depth-sensor estimation result, enabling staff to verify AI-detected furniture items. |

---

## Utilities

### `src/lib/utils/api.svelte.ts` — API client

The primary interface between the admin UI and the REST API.

| Export | Signature | Description |
|---|---|---|
| `apiFetch` | `(path, options?) => Promise<T>` | Core fetch wrapper. Injects `Authorization` header, handles `Content-Type` (JSON vs FormData), retries once on 401 by refreshing the token. |
| `apiGet` | `(path) => Promise<T>` | `GET` with auth |
| `apiPost` | `(path, body?) => Promise<T>` | `POST` with auth; body may be a plain object or `FormData` |
| `apiPatch` | `(path, body) => Promise<T>` | `PATCH` with auth |
| `apiPut` | `(path, body) => Promise<T>` | `PUT` with auth |
| `apiDelete` | `(path) => Promise<T>` | `DELETE` with auth |
| `apiDownload` | `(path, filename) => Promise<void>` | Downloads a binary response (e.g. PDF) with auth headers and triggers a browser file download. Use this instead of `<a href>` for protected files. |
| `ApiError` | `class` | Error subclass with a `status: number` property. Thrown by `apiFetch` on non-2xx responses. |

The formatting helpers `formatEuro`, `formatDate`, and `formatDateTime` are re-exported from `api.svelte.ts` for convenience but live in `src/lib/utils/format.ts`.

### `src/lib/utils/format.ts` — Formatting helpers

| Function | Input | Output example |
|---|---|---|
| `formatEuro(cents)` | `number` (integer cents) | `"1.234,56 €"` (de-DE locale) |
| `formatDate(dateStr)` | ISO date string | `"25.02.2026"` |
| `formatDateTime(dateStr)` | ISO datetime string | `"25.02.2026, 14:30"` |

### `src/lib/utils/pricing.ts` — Pricing calculations

| Export | Description |
|---|---|
| `ROW_OPTIONS` | Array of offer line item row types with labels (De/Montage, Halteverbotszone, etc.) |
| `rowToLabel(row)` | Converts a row number to its German label |
| `COST_PER_PERSON_HOUR` | Internal labor cost constant (`18.23` EUR) |
| `calculateLaborCents(persons, hours, rateCents)` | Computes total labor cost in cents |
| `calculateNonLaborCents(lineItems)` | Sums line item totals in cents |
| `calculateBruttoCents(nettoCents)` | Applies 19% VAT |
| `calculateLaborProfit(persons, hours, rateCents)` | Profit margin from labor after internal cost |
| `reverseCalculateRate(bruttoCents, nonLaborCents, persons, hours)` | Back-calculates hourly rate from a target brutto price |
| `isFlatTotalItem(li)` | Detects backend flat-total line items (qty=0, price=0, total>0 pattern) |
| `normalizeFlatTotalItem(li)` | Converts flat-total items to qty=1, price=total for edit calculations |

### `src/lib/utils/calendar.ts` — Calendar grid

| Export | Description |
|---|---|
| `buildCalendar(y, m, sched, today?)` | Builds a flat array of `CalendarDay` objects for the given year/month. Pads the start of the week to Monday-first layout. Merges API schedule data by date key. |
| `CalendarDay` | `{ date, key, schedule, isToday }` |
| `BaseDaySchedule` | `{ date, bookings, availability: { capacity, booked, available, remaining } }` |

### `src/lib/utils/sorting.ts` — Sorting and filtering

| Function | Description |
|---|---|
| `sortItems(items, sortKey, ascending)` | Generic array sort by a typed key. String values use `localeCompare` with German locale (`'de'`). |
| `filterItemsByPhotoIndex(items, filterIndex)` | Filters estimation items to those visible in a given photo index, using `bbox_image_index` or `seen_in_images`. |

### `src/lib/utils/volume.ts` — Volume computation

| Function | Description |
|---|---|
| `computeTotalVolume(items)` | Sums `volume_m3 * quantity` across all estimation items. |

### `src/lib/utils/floor.ts` — Floor label helpers

| Function | Description |
|---|---|
| `floorLabel(floor)` | Converts a floor string (`"0"`, `"1"`, `"-1"`) to a German label (`"Erdgeschoss"`, `"1. OG"`, `"Keller"`). |
| `parseFloor(floor)` | Parses a German floor label or numeric string to an integer floor number. |

---

## Design System

The admin dashboard uses a neumorphic design language: soft-extruded cards on a light grey background using paired drop shadows. All design tokens are defined as CSS custom properties in `src/styles/admin.css` and imported in `+layout.svelte`.

### Color palette

| Token | Value | Usage |
|---|---|---|
| `--admin-bg` | `#e8ecf1` | Page background, input backgrounds |
| `--admin-card-bg` | `#ffffff` | Card and panel surfaces |
| `--admin-primary` | `#6366f1` | Primary buttons, active states, focus rings |
| `--admin-primary-hover` | `#4f46e5` | Button hover |
| `--admin-text` | `#1a1a2e` | Primary text, headings |
| `--admin-text-muted` | `#64748b` | Secondary text, labels |
| `--admin-text-dim` | `#94a3b8` | Placeholder text, timestamps, disabled |
| `--admin-border` | `#e2e8f0` | Card borders, dividers |
| `--admin-border-light` | `#f1f5f9` | Subtle row separators |
| `--admin-danger` | `#ef4444` | Destructive actions, error states |
| `--admin-danger-hover` | `#dc2626` | Destructive hover |
| `--admin-success` | `#22c55e` | Confirmed status, success toasts |
| `--admin-warning` | `#f59e0b` | Pending status, calendar conflicts |

The sidebar uses its own hardcoded dark palette (`#1a1a2e` background) with `rgba(99, 102, 241, 0.2)` for the active link highlight and `#a5b4fc` for the active link text.

### Shadows (neumorphic)

| Token | Value | Usage |
|---|---|---|
| `--admin-shadow-outset` | `5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff` | Standard card elevation |
| `--admin-shadow-outset-sm` | `3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff` | Small elevated elements |
| `--admin-shadow-outset-primary` | `3px 3px 10px rgba(99, 102, 241, 0.3)` | Primary button elevation |
| `--admin-shadow-inset` | `inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff` | Input fields, inset wells |
| `--admin-shadow-focus` | inset shadows + `0 0 0 2px rgba(99, 102, 241, 0.2)` | Focused input state |

### Spacing and shape

| Token | Value | Usage |
|---|---|---|
| `--admin-radius` | `12px` | Cards, modals |
| `--admin-radius-sm` | `8px` | Buttons, badges |
| `--admin-radius-xs` | `6px` | Small elements |

### Typography

- **Font**: System font stack (inherits from public site — Inter self-hosted)
- **Heading (h1)**: `1.5rem`, `font-weight: 700`, color `#1a1a2e`
- **Section heading (h2)**: `0.9375rem`, `font-weight: 600`, color `#334155`
- **Body**: `0.875rem`, color `#334155`
- **Secondary**: `0.8125rem`, color `#64748b`
- **Timestamps/dim**: `0.75rem`, color `#94a3b8`

### Responsive layout

- **Breakpoint**: `768px`
- **Sidebar**: Fixed 240px (desktop) / off-canvas drawer (mobile)
- **Collapsed sidebar**: 64px icon-only strip
- **Touch targets**: Minimum 44px height on all interactive elements on mobile
- **Tables**: Horizontally scrollable on narrow viewports
- **Content padding**: `1.5rem` (desktop), `0.75rem` (mobile)

---

## API Integration

All API calls go through the client in `src/lib/utils/api.svelte.ts`. The base URL is `https://api.aufraeumhelden.com` (overridable via `VITE_API_BASE`).

### Making a request

```typescript
import { apiGet, apiPost, apiPatch, apiDownload } from '$lib/utils/api.svelte';

// GET
const data = await apiGet<DashboardData>('/api/v1/admin/dashboard');

// POST with JSON body
await apiPost('/api/v1/admin/quotes', { customer_id: 42, volume_m3: 35 });

// POST with FormData (file upload)
const form = new FormData();
form.append('quote_id', quoteId);
form.append('images[]', file);
await apiPost('/api/v1/estimates/depth-sensor', form);

// PATCH
await apiPatch(`/api/v1/quotes/${id}`, { notes: 'Updated note' });

// Authenticated file download (PDF)
await apiDownload(`/api/v1/offers/${id}/pdf`, `Angebot-${id}.pdf`);
```

### Error handling pattern

Every page wraps API calls in `try/catch` and surfaces errors via `showToast`:

```typescript
import { showToast } from '$lib/components/admin/Toast.svelte';

try {
    await apiPost(`/api/v1/admin/offers/${id}/send`);
    showToast('Angebot wurde versendet.', 'success');
} catch (e) {
    showToast((e as Error).message, 'error');
}
```

`ApiError` includes a `status` number for cases where you need to branch on HTTP status code:

```typescript
import { ApiError } from '$lib/utils/api.svelte';

try {
    await apiDelete(`/api/v1/admin/customers/${id}`);
} catch (e) {
    if (e instanceof ApiError && e.status === 409) {
        showToast('Kunde hat noch offene Anfragen.', 'error');
    } else {
        showToast((e as Error).message, 'error');
    }
}
```

### Important: file downloads

Protected file endpoints (e.g. PDF downloads) require the `Authorization` header. Plain `<a href>` tags cannot send headers, so they will receive a 401. Always use `apiDownload()` instead:

```typescript
// Correct
await apiDownload(`/api/v1/offers/${id}/pdf`, `Angebot-${id}.pdf`);

// Wrong — will fail with 401
window.location.href = `${API_BASE}/api/v1/offers/${id}/pdf`;
```

### Public endpoints (no auth required)

Two endpoint groups do not require a token:

- `POST /api/v1/auth/login` and `POST /api/v1/auth/refresh`
- `GET /api/v1/estimates/images/*` — image/video proxy used by `<img src>` and `<video src>` tags in the estimation reviewer

---

## Conventions

### State management

- All reactive state uses Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props`
- Module-level reactive state (outside `.svelte` files) requires the `.svelte.ts` file extension
- Imports to `.svelte.ts` modules must include the explicit `.svelte` suffix:

```typescript
import { auth } from '$lib/stores/auth.svelte';
import { apiGet } from '$lib/utils/api.svelte';
```

### Naming

- Page components: `+page.svelte`, `+layout.svelte` (SvelteKit file-based routing)
- Admin components: PascalCase, e.g. `DataTable.svelte`, `StatusBadge.svelte`
- Utility modules: camelCase, e.g. `pricing.ts`, `calendar.ts`
- Store modules: camelCase with `.svelte.ts` extension, e.g. `auth.svelte.ts`

### Pagination

- Lists use offset/limit pagination: 20 items per page
- Query parameters: `?limit=20&offset=0`

### Currency

- All monetary values are stored and transmitted in **integer cents** (e.g. `12345` = 123.45 EUR)
- Display using `formatEuro(cents)` which produces de-DE locale output: `"123,45 €"`
- The `PriceInput` component handles brutto/netto conversion (19% VAT) and emits values in cents

### Dates

- API dates are ISO 8601 strings
- Display using `formatDate(dateStr)` → `"25.02.2026"` or `formatDateTime(dateStr)` → `"25.02.2026, 14:30"`
- Calendar uses `YYYY-MM-DD` string keys for day lookup

### Modals

- Modals are declared inline within the page component that needs them
- Visibility is toggled via a `$state` boolean (e.g. `let showCreateModal = $state(false)`)
- No shared modal management system

### Language

- All UI text is in **German** (Formal register, "Sie" form)
- Error messages from the API may be in English; wrap with a German prefix where appropriate
- Status values are English strings from the API (e.g. `"open"`, `"accepted"`) but rendered through `StatusBadge` which maps them to German labels
