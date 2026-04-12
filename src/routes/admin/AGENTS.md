# admin — SvelteKit Admin Dashboard SPA

Client-side only SPA at `/admin/*`. JWT auth, REST API, neumorphic design.

> **Parent context**: [../AGENTS.md](../AGENTS.md)

## Pages

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard — KPIs, recent activity, conflict dates |
| `/admin/login` | Login form (separate layout, no sidebar) |
| `/admin/inquiries` | Inquiry list + create form |
| `/admin/inquiries/[id]` | Inquiry detail — estimation, pricing, offer, assignments |
| `/admin/customers` | Customer directory |
| `/admin/customers/[id]` | Customer detail with linked inquiries |
| `/admin/emails` | Email thread list + compose |
| `/admin/calendar` | Monthly calendar — bookings, capacity |
| `/admin/settings` | User management |

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Sidebar.svelte` | `$lib/components/admin/` | Nav sidebar, collapse on mobile |
| `DataTable.svelte` | `$lib/components/admin/` | Sortable table with row click |
| `StatusBadge.svelte` | `$lib/components/admin/` | Color-coded 20+ statuses |
| `PriceInput.svelte` | `$lib/components/admin/` | Brutto/netto toggle with 19% VAT |
| `RouteMap.svelte` | `$lib/components/admin/` | Leaflet map with route polyline |
| `Toast.svelte` | `$lib/components/admin/` | Notification system |
| `EmployeeAssignmentPanel.svelte` | `$lib/components/admin/` | Shared assignment panel (inquiry + calendar) |
| `CalendarSidePanel.svelte` | `routes/admin/calendar/` | Day detail, capacity, assignments |

## Auth Flow

1. Login → `access_token` + `refresh_token` in localStorage
2. Every `apiFetch()` injects Bearer token
3. On 401 → auto-refresh → retry
4. Refresh fails → redirect to `/admin/login`

**File downloads must use `apiDownload()`** — anchor tags cannot send Authorization header.

## API Client (`$lib/utils/api.svelte.ts`)

| Function | Purpose |
|----------|---------|
| `apiFetch(path, options)` | Core wrapper with auth + refresh |
| `apiGet/Post/Patch/Put/Delete` | CRUD shortcuts |
| `apiDownload(path, filename)` | Authenticated blob → browser download |
| `formatEuro(cents)` | Cents → "1.234,56 EUR" |
| `formatDate/DateTime` | ISO → German locale |

## Shared Constants (`$lib/utils/constants.ts`)

- `INQUIRY_STATUS_LABELS` — German status labels for all states
- `CUSTOMER_TYPE_LABELS` — Privat/Unternehmen labels

## Patterns

- Svelte 5 runes outside `.svelte` → use `.svelte.ts` extension
- Imports need explicit `.svelte` suffix: `from '$lib/stores/auth.svelte'`
- Currency: stored in cents, displayed via `formatEuro()`
- Design: neumorphic, indigo primary, 768px breakpoint, 44px touch targets