# frontend — SvelteKit Admin Dashboard

Git submodule → `git@github.com:timefliez1210/aust-umzuege.git`

## Stack

- SvelteKit (Svelte 5, runes mode)
- Tailwind CSS
- `@sveltejs/adapter-static` — builds to static HTML
- No server-side rendering — all data fetched from the Rust API

## Directory Layout

```
src/routes/
  admin/
    calendar/         — Calendar page + CalendarSidePanel component
    calendar-items/   — Calendar item CRUD
    customers/        — Customer list + detail
    employees/       — Employee list + detail + document upload
    inquiries/        — Inquiry list, detail, estimations, offer, assignments
  f/
    foto-angebot/     — Photo upload form (public, no auth)
  kostenloses-angebot/ — Contact form (public, no auth)
  worker/            — Employee self-clock (auth required)

src/lib/
  components/admin/   — Shared admin components (EmployeeAssignmentPanel, etc.)
  stores/             — Svelte stores (auth, inquiries, calendar, etc.)
  utils/              — helpers, format.ts, constants.ts
  data/               — Static data (status labels, etc.)
```

## API Integration

All API calls go through `src/lib/api.svelte.ts`. The base URL comes from `$env/static/public` or defaults to `/api/v1`.

Auth: JWT stored in `localStorage`, refreshed automatically. All admin routes require admin role.

## Key Patterns

- **Status labels**: `INQUIRY_STATUS_LABELS` and `CUSTOMER_TYPE_LABELS` in `lib/utils/constants.ts`
- **Floor parsing**: `lib/utils/floor.ts` — German floor labels (Erdgeschoss, 3. Stock, etc.)
- **Component duplication debt**: 6,405-line inquiry detail page needs extraction (see root TODO)

## Running

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # Static HTML to build/
```