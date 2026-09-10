# admin — SvelteKit Admin Dashboard SPA

Client-side only SPA at `/admin/*`. JWT auth, REST API, neumorphic design.

> **Parent context**: [../AGENTS.md](../../../AGENTS.md)

## Pages

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard — KPIs, recent activity, conflict dates |
| `/admin/login` | Login form (separate layout, no sidebar) |
| `/admin/inquiries` | Inquiry list + create form |
| `/admin/inquiries/[id]` | Inquiry detail — estimation, pricing, offer, assignments, invoices |
| `/admin/customers` | Customer directory |
| `/admin/customers/[id]` | Customer detail with linked inquiries |
| `/admin/emails` | Email thread list + compose |
| `/admin/emails/[id]` | Email thread detail |
| `/admin/calendar` | Monthly calendar — bookings, capacity, day side panel; grid replaced by a `MonthAgenda` list view at ≤768px |
| `/admin/orders` | Orders list |
| `/admin/reports` | Reports and analytics |
| `/admin/employees` | Employee list |
| `/admin/employees/[id]` | Employee detail |
| `/admin/calendar-items` | Calendar item list |
| `/admin/calendar-items/[id]` | Calendar item detail |
| `/admin/rechnungsausgangsbuch` | Invoice register — one year per tab in invoice-number order; KPI row, Monatsübersicht (chart + per-month figures), month/status/search filters, sortable columns, editable Bemerkungen/Teilzahlung/Zahlungsart, "Bezahlt" button opening a `ReviewRequestModal`, XLSX export (register + Monatsübersicht sheets), links to invoice PDF |
| `/admin/kva-buch` | KVA register — same shape as the invoice register, over `offers` |
| `/admin/vehicles` | Fleet list — vehicles + maintenance reminders (due dates, ack/reset) |
| `/admin/storage` | Storage-rental contracts (Lagerung) — create/edit, billing address, PDF |
| `/admin/flash-contacts` | Quick callback requests (name/phone/time preference) with reminder state |
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
| `MonthAgenda.svelte` | `routes/admin/calendar/_components/` | Mobile (≤768px) agenda list replacing the month grid |
| `ManualInvoiceEditor.svelte` | `routes/admin/inquiries/[id]/_components/` | Free line-item table (Menge × Einzelpreis netto) for a full invoice's "Manuelle Rechnung" toggle |
| `InvoicesSection.svelte` | `routes/admin/inquiries/[id]/_components/` | Invoice list/actions for an inquiry; hosts the `is_manual` toggle and `ManualInvoiceEditor` |
| `ReviewRequestModal.svelte` | `$lib/components/admin/` | Google-review request prompt, opened from the register's "Bezahlt" button |
| `InvoiceSendModal.svelte` | `$lib/components/admin/` | Compose/send an invoice email |
| `ConfirmationDialog.svelte` | `$lib/components/admin/` | Reusable confirm/cancel modal, replaces inline `confirm()` |
| `KnownAddressPicker.svelte` | `$lib/components/admin/` | Picks from a customer's saved address book |
| `PhotoVideoUpload.svelte` | `$lib/components/admin/` | Estimation media upload |
| `MonatsUebersicht.svelte` / `KvaMonatsUebersicht.svelte` | `$lib/components/admin/` | Per-month chart + figures for the invoice/KVA registers |

`DataTable.svelte` reflows into a stacked card list below the shared 768px admin mobile breakpoint (see its `mobile-sort`/card-mode CSS); the shared `.modal`/`.modal-backdrop` classes anchor as a bottom sheet at the same breakpoint (`admin-components.css`), and `.modal-sheet` is a full-screen variant for content with its own header/body/footer.

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

- `INQUIRY_STATUS_LABELS` — German status labels for all states (from `$lib/utils/status.ts`)
- `CUSTOMER_TYPE_LABELS` — Privat/Unternehmen labels

## Multi-Day Scheduling (CalendarSidePanel + EmployeeAssignmentPanel)

Both inquiries and appointments (Termine) support multi-day scheduling. The two code paths are **fully symmetrical** — behavior described here applies to both unless stated otherwise.

### How multi-day works

- The "Mehrtägiger Termin" section shows a **Von** (fixed, inquiry/termin start date) and **Bis** date picker.
- Changing **Bis** calls `applyInquiryDateRange` / `applyTerminDateRange`, which regenerates the day list.
- Saving calls `saveInquiryDays` / `saveTerminDays`: PATCHes `end_date` on the entity, then PUTs the full flat employee-assignment array (one entry per employee × job_date) in a single full-replace call.

### Single tracked time (consolidation)

> **History**: there used to be two times per employee per day — *Geplant* (planned, `start_time`/`end_time` → `planned_hours`) and *Ist* (actual, `clock_in`/`clock_out`). That was **consolidated to a single tracked time**: the UI now only edits **Ist** (`clock_in`/`clock_out` + `break_minutes`). The DB columns `start_time`/`end_time`/`planned_hours` still exist and the backend `put_*_employees` PUT still accepts them, but **nothing in the UI writes planned times anymore** — they survive only as a read-fallback (see `fillEmp` below). Do not reintroduce a planned-time input.

### Employee auto-copy to new days

When the date range is extended, any **newly generated day** inherits the employees from day 1 as a template. The `fillEmp` function is applied to **all** days (both new and existing) on every range update and on initial load:

```
fillEmp(e):
  clock_in  = e.clock_in  ?? e.start_time   // legacy read-fallback: use planned only if Ist unset
  clock_out = e.clock_out ?? e.end_time
  break_minutes = e.break_minutes > 0 ? keep : legal minimum (ArbZG: >6h → 30min, >9h → 45min)
```

The `?? e.start_time` fallback only matters for old rows written before the consolidation; new rows set `clock_in`/`clock_out` directly.

### Day-level Start/Ende (bulk-apply)

Each day in the multi-day editor (`CalendarSidePanel`) has a day-level **Start**/**Ende** pair *above* the per-employee rows. These are a **convenience bulk-setter, not a separate stored time**:

- Editing a day's Start/Ende (`applyDayTime`) writes that time into **every** assigned employee's `clock_in`/`clock_out` for that day and PATCHes each row immediately.
- Editing one employee's Ist afterwards overrides just that row — every change (day-level and per-row) saves independently, so **last write wins**.
- On load, the day-level field is derived via `commonEmpTime`: it shows the crew's shared time, or blank if the employees differ.
- All time inputs are normalised through `normalizeTimeInput` (`$lib/utils/format`), which accepts loose input (`7`, `7:30`, `3:30`) and pads to `HH:MM:SS`. Never hand-roll `value + ':00'` / `value.length === 5` — that silently drops single-digit-hour entries.

`break_minutes` is the per-employee break deduction applied to the Ist hours. If a worker took no break, the admin zeros it manually. Admin inputs take the break as **decimal hours** (e.g. `0.25`) and convert to/from the stored integer minutes via `breakHoursToMinutes`/`breakMinutesToHours` (`$lib/utils/time.ts`), used in `CalendarSidePanel`, `EmployeeAssignmentPanel` and the employee detail's `HoursAndAssignments`. The worker-facing UI (`/worker/*`) is unaffected — it never edits breaks.

### EmployeeAssignmentPanel — multi-day summary mode

When the flat assignment array contains **more than one distinct `job_date`** (i.e. it is a multi-day job), `EmployeeAssignmentPanel` switches from per-row time inputs to a **deduplicated summary**:

- One row per unique employee
- **Tage** column = number of days assigned
- **Stunden Ist** = sum of actual hours across all days (from `actual_hours` or derived from `clock_in`/`clock_out`/`break_minutes`)
- Single-day mode keeps the original compact time-input rows unchanged

> **Note**: The multi-day summary view does **not** show a remove button. Employee removal is only available in single-day inquiry mode or calendar-item mode.

### Status independence

Employee assignment display and hour aggregation apply regardless of inquiry/termin status. The only statuses excluded from the calendar view entirely are `cancelled`, `rejected`, `expired` (filtered in the backend schedule query).