# Admin Dashboard Module

The admin panel is a **separate SPA** from the public website. It runs client-side only (`ssr: false`, `prerender: false`) and talks to a REST API at `https://api.aufraeumhelden.com`.

## Architecture

- **Auth**: JWT with access/refresh tokens, stored in localStorage (`aust_access_token`, `aust_refresh_token`)
- **API wrapper**: `$lib/utils/api.svelte.ts` — auto-injects Bearer token, retries on 401 with refresh
- **Auth store**: `$lib/stores/auth.svelte.ts` — Svelte 5 runes, manages login/logout/token state
- **SPA fallback**: `svelte.config.js` sets `fallback: 'admin.html'` so Apache serves the shell for all `/admin/*` routes
- **Layout guard**: `+layout.svelte` redirects to `/admin/login` if not authenticated

## Pages

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard — KPIs, recent activity, conflict date alerts |
| `/admin/login` | Login form (separate layout, no sidebar) |
| `/admin/quotes` | Quote list + create form (manual, photo, video volume modes) |
| `/admin/quotes/[id]` | Quote detail — item estimation table, pricing, line items, route map, photo/video upload, item reviewer lightbox |
| `/admin/offers` | Offer list with status tabs (draft/sent/accepted/rejected) |
| `/admin/offers/[id]` | Offer detail — PDF download, line items editor, price calculator |
| `/admin/customers` | Customer directory + create form |
| `/admin/customers/[id]` | Customer detail with linked quotes/offers |
| `/admin/emails` | Email thread list + compose form |
| `/admin/emails/[id]` | Email thread detail with draft management |
| `/admin/calendar` | Monthly calendar — bookings, capacity management |
| `/admin/settings` | User management, password change, role assignment |

## Components (`src/lib/components/admin/`)

| Component | Purpose |
|-----------|---------|
| `Sidebar.svelte` | Nav sidebar — collapsible on desktop, slide-in drawer on mobile |
| `DataTable.svelte` | Sortable table with row click, empty state, horizontal scroll on mobile |
| `StatusBadge.svelte` | Color-coded badge for 20+ statuses |
| `PriceInput.svelte` | Brutto/netto toggle with automatic 19% VAT calculation |
| `RouteMap.svelte` | Leaflet map with route polyline, start/end markers, distance badge |
| `Toast.svelte` | Notification system — success/error/info, 4s auto-dismiss, `showToast()` export |
| `ImageLightbox.svelte` | Full-size image overlay with bounding box visualization |

## API Client (`$lib/utils/api.svelte.ts`)

| Function | Purpose |
|----------|---------|
| `apiFetch(path, options)` | Core wrapper — injects Bearer token, retries on 401 with token refresh |
| `apiGet(path)` | GET with auth |
| `apiPost(path, body?)` | POST with auth (JSON or FormData) |
| `apiPatch(path, body)` | PATCH with auth |
| `apiPut(path, body)` | PUT with auth |
| `apiDelete(path)` | DELETE with auth |
| `apiDownload(path, filename)` | GET with auth → blob → triggers browser download |
| `formatEuro(cents)` | Cents → "1.234,56 EUR" (de-DE locale) |
| `formatDate(dateStr)` | ISO → "25.02.2026" |
| `formatDateTime(dateStr)` | ISO → "25.02.2026, 14:30" |

**Important**: File downloads (PDF, etc.) must use `apiDownload()`, not `<a href>` tags — anchor tags cannot send the Authorization header required by protected endpoints.

## API Endpoints Used by the Dashboard

All endpoints except login/refresh require a valid JWT via `Authorization: Bearer <token>`.

### Auth (public — no token required)
- `POST /api/v1/auth/login` → `{access_token, refresh_token, expires_in}`
- `POST /api/v1/auth/refresh` → `{access_token, refresh_token}`

### Auth (protected — token required)
- `POST /api/v1/auth/register` — create user (name, email, password, role)
- `POST /api/v1/auth/change-password` — change own password

### Dashboard
- `GET /api/v1/admin/dashboard` → `{open_quotes, pending_offers, todays_bookings, total_customers, recent_activity, conflict_dates}`

### Quotes
- `GET /api/v1/admin/quotes?status=&search=&limit=&offset=` — list with filters
- `POST /api/v1/admin/quotes` — create (customer_id, addresses, notes, volume, date, distance)
- `GET /api/v1/quotes/{id}` → full detail with items, offers, addresses, source images/videos
- `PATCH /api/v1/quotes/{id}` — update fields (notes, volume_m3, preferred_date, etc.)
- `PUT /api/v1/quotes/{id}/estimation-items` — bulk update/delete estimation items
- `POST /api/v1/admin/quotes/{id}/accept` — transition to accepted
- `POST /api/v1/admin/quotes/{id}/done` — transition to done
- `POST /api/v1/admin/quotes/{id}/paid` — transition to paid
- `POST /api/v1/admin/quotes/{id}/delete` — soft delete

### Estimates
- `POST /api/v1/estimates/depth-sensor` — photo upload (FormData: `quote_id`, `images[]`)
- `POST /api/v1/estimates/video` — video upload (FormData: `quote_id`, `video`)
- `GET /api/v1/estimates/images/{key}` — **public** image/video proxy (no auth, used by `<img>`/`<video>` tags)

### Offers
- `GET /api/v1/admin/offers?status=&limit=&offset=` — list with status filter
- `GET /api/v1/admin/offers/{id}` → offer detail with line items, customer, addresses
- `POST /api/v1/offers/generate` — generate from quote (quote_id, persons, hours, rate, price)
- `GET /api/v1/offers/{id}/pdf` — download PDF (use `apiDownload()`, not `<a href>`)
- `PATCH /api/v1/admin/offers/{id}` — update pricing & line items
- `POST /api/v1/admin/offers/{id}/regenerate` — regenerate PDF with new pricing
- `POST /api/v1/admin/offers/{id}/send` — email PDF to customer
- `POST /api/v1/admin/offers/{id}/reject` — mark rejected
- `POST /api/v1/admin/offers/{id}/delete` — delete offer

### Customers
- `GET /api/v1/admin/customers?search=&limit=&offset=` — list/search
- `POST /api/v1/admin/customers` — create (email, name, phone)
- `GET /api/v1/admin/customers/{id}` → detail with linked quotes/offers
- `PATCH /api/v1/admin/customers/{id}` — update fields
- `POST /api/v1/admin/customers/{id}/delete` — delete customer

### Calendar
- `GET /api/v1/calendar/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD` → `{dates: DaySchedule[]}`
- `PUT /api/v1/calendar/capacity/{date}` — set daily capacity override
- `POST /api/v1/calendar/bookings` — create (booking_date, customer_name, customer_email, description)
- `PATCH /api/v1/calendar/bookings/{id}` — update status (confirmed/cancelled)
- `DELETE /api/v1/calendar/bookings/{id}` — delete booking

### Emails
- `GET /api/v1/admin/emails?search=&limit=&offset=` — list threads
- `GET /api/v1/admin/emails/{id}` → thread detail with messages
- `POST /api/v1/admin/emails/compose` — send new email (customer_email, subject, body_text)
- `POST /api/v1/admin/emails/messages/{msgId}/send` — send draft
- `POST /api/v1/admin/emails/messages/{msgId}/discard` — discard draft
- `PATCH /api/v1/admin/emails/messages/{msgId}` — update draft body
- `POST /api/v1/admin/emails/messages/{msgId}/regenerate` — regenerate LLM response

### Users
- `GET /api/v1/admin/users` — list users
- `POST /api/v1/admin/users/{id}/delete` — delete user

### Other
- `POST /api/v1/distance/calculate` — route geometry (`{addresses: [string, string]}` → legs with geometry)
- `PATCH /api/v1/admin/addresses/{id}` — update address fields (street, city, postal_code, floor, has_elevator)

## Calendar Data Model

```
DaySchedule: { date, bookings[], availability: { capacity, booked, available, remaining } }
BookingItem: { id, quote_id, customer_name, customer_email, description, status }
Booking statuses: pending → confirmed | cancelled
```

- Monthly grid view (Mon-Sun), cell shows booked/capacity badge
- Day click opens modal: capacity editor, booking list, create booking form
- Dashboard surfaces conflict dates (overbooked days)

## Auth Patterns

### Token flow
1. Login → store `access_token` + `refresh_token` in localStorage
2. Every `apiFetch()` call injects `Authorization: Bearer <access_token>`
3. On 401 → auto-refresh token via `/api/v1/auth/refresh` → retry request
4. If refresh fails → `auth.logout()` → redirect to `/admin/login`

### Route protection
- Public endpoints (no token): `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/estimates/images/*`
- Protected endpoints (admin JWT): everything else under `/api/v1/`
- File downloads: must use `apiDownload()` to include auth header (not `<a href>`)
- Image/video display: uses `<img src>` / `<video>` tags → served by public `/api/v1/estimates/images/*` endpoint

## Patterns & Conventions

- **State**: Svelte 5 runes (`$state`, `$derived`, `$effect`) — files outside `.svelte` must use `.svelte.ts`
- **Imports**: `from '$lib/stores/auth.svelte'` (explicit `.svelte` suffix required)
- **Pagination**: offset/limit, 20 items per page
- **Currency**: Stored in cents, displayed via `formatEuro()` (cents → "1.234,56 EUR")
- **Dates**: German locale via `formatDate()` / `formatDateTime()`
- **Errors**: `showToast(message, 'error')` for all API failures
- **Modals**: Inline in page components, toggled via `$state` booleans
- **Design**: Neumorphic (soft inset/outset shadows), indigo primary, German UI throughout
- **Mobile**: 768px breakpoint, 44px touch targets, sidebar becomes drawer, tables scroll horizontally
