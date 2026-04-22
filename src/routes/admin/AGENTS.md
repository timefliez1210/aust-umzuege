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

## Multi-Day Scheduling (CalendarSidePanel + EmployeeAssignmentPanel)

Both inquiries and appointments (Termine) support multi-day scheduling. The two code paths are **fully symmetrical** — behavior described here applies to both unless stated otherwise.

### How multi-day works

- The "Mehrtägiger Termin" section shows a **Von** (fixed, inquiry/termin start date) and **Bis** date picker.
- Changing **Bis** calls `applyInquiryDateRange` / `applyTerminDateRange`, which regenerates the day list.
- Saving calls `saveInquiryDays` / `saveTerminDays`: PATCHes `end_date` on the entity, then PUTs the full flat employee-assignment array (one entry per employee × job_date) in a single full-replace call.

### Employee auto-copy to new days

When the date range is extended, any **newly generated day** inherits the employees from day 1 as a template. The `fillEmp` function is applied to **all** days (both new and existing) on every range update and on initial load:

```
fillEmp(e):
  clock_in  = e.clock_in  ?? e.start_time   // pre-fill Ist from Pl. if not yet set
  clock_out = e.clock_out ?? e.end_time
  planned_hours = existing > 0 ? keep : recompute from start/end via computeHoursAndBreak
  break_minutes = existing > 0 ? keep : legal minimum (ArbZG: >6h → 30min, >9h → 45min)
```

**Key invariant**: neither Geplant nor Ist should ever be empty after a day is generated. If an employee has `start_time`/`end_time` set, `planned_hours` and `clock_in`/`clock_out` are always populated.

### Geplant vs Ist

| Field | Source | Meaning |
|-------|--------|---------|
| **Geplant** | `planned_hours` (DB) | Net planned hours = gross(start→end) − legal break. Computed by `computeHoursAndBreak`. |
| **Ist** | derived from `clock_in`, `clock_out`, `break_minutes` | Actual hours worked. Pre-filled from planned times; admin edits after the fact. |

`break_minutes` is a single shared field — the same break deduction applies to both Geplant and Ist. If a worker actually took no break, the admin zeros out `break_minutes` manually.

### EmployeeAssignmentPanel — multi-day summary mode

When the flat assignment array contains **more than one distinct `job_date`** (i.e. it is a multi-day job), `EmployeeAssignmentPanel` switches from per-row time inputs to a **deduplicated summary**:

- One row per unique employee
- **Tage** column = number of days assigned
- **Stunden Ist** = sum of actual hours across all days (from `actual_hours` or derived from `clock_in`/`clock_out`/`break_minutes`)
- Remove button deletes all assignments for that employee across all days (backend DELETE removes all job_dates for the (inquiry, employee) pair in one query)
- Single-day mode keeps the original compact time-input rows unchanged

### Status independence

Employee assignment display and hour aggregation apply regardless of inquiry/termin status. The only statuses excluded from the calendar view entirely are `cancelled`, `rejected`, `expired` (filtered in the backend schedule query).