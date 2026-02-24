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
| `/admin/offers/[id]` | Offer detail — PDF generation, line items editor, price calculator |
| `/admin/customers` | Customer directory + create form |
| `/admin/customers/[id]` | Customer detail with linked quotes/offers |
| `/admin/emails` | Email thread list + compose form |
| `/admin/emails/[id]` | Email thread detail with reply |
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

## API Endpoints

### Auth
- `POST /api/v1/auth/login` → `{access_token, refresh_token, expires_in}`
- `POST /api/v1/auth/refresh` → `{access_token, refresh_token}`
- `POST /api/v1/auth/register` — create user (name, email, password, role)
- `POST /api/v1/auth/change-password`

### Dashboard
- `GET /api/v1/admin/dashboard` → `{open_quotes, pending_offers, todays_bookings, total_customers, recent_activity, conflict_dates}`

### Quotes
- `GET /api/v1/admin/quotes?status=&search=&limit=&offset=`
- `POST /api/v1/admin/quotes` — create (customer_id, addresses, notes, volume, date, distance)
- `PATCH /api/v1/quotes/{id}` — update fields
- `GET /api/v1/quotes/{id}` → full detail with items, offers, addresses
- `PUT /api/v1/quotes/{id}/estimation-items` — bulk update items
- `POST /api/v1/admin/quotes/{id}/accept|done|paid|delete` — status transitions
- `POST /api/v1/estimates/depth-sensor` — photo upload (FormData: quote_id, images[])
- `POST /api/v1/estimates/video` — video upload (FormData: quote_id, video)

### Offers
- `GET /api/v1/admin/offers?status=&limit=&offset=`
- `POST /api/v1/offers/generate` — generate from quote (quote_id, persons, hours, rate, price)
- `PATCH /api/v1/admin/offers/{id}` — update pricing/line items
- `POST /api/v1/admin/offers/{id}/regenerate` — regenerate PDF

### Customers
- `GET /api/v1/admin/customers?search=&limit=&offset=`
- `POST /api/v1/admin/customers` — create (email, name, phone)

### Calendar
- `GET /api/v1/calendar/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD` → `{dates: DaySchedule[]}`
- `PUT /api/v1/calendar/capacity/{date}` — set daily capacity
- `POST /api/v1/calendar/bookings` — create (booking_date, customer_name, customer_email, description)
- `PATCH /api/v1/calendar/bookings/{id}` — update status (confirmed/cancelled)
- `DELETE /api/v1/calendar/bookings/{id}`

### Emails
- `GET /api/v1/admin/emails?search=&limit=&offset=`
- `POST /api/v1/admin/emails/compose` — send (customer_email, subject, body_text)

### Other
- `POST /api/v1/distance/calculate` — route geometry (addresses → legs with geometry)
- `PATCH /api/v1/admin/addresses/{id}` — update address fields
- `GET /api/v1/admin/users` / `POST /api/v1/admin/users/{id}/delete`

## Calendar Data Model

```
DaySchedule: { date, bookings[], availability: { capacity, booked, available, remaining } }
BookingItem: { id, quote_id, customer_name, customer_email, description, status }
Booking statuses: pending → confirmed | cancelled
```

- Monthly grid view (Mon–Sun), cell shows booked/capacity badge
- Day click opens modal: capacity editor, booking list, create booking form
- Dashboard surfaces conflict dates (overbooked days)

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
