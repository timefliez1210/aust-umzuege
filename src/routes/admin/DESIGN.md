# Console design system

The admin console (`/admin/*`) is built from Tailwind v4 utilities and a small set of
primitives. No per-page stylesheet, no `<style>` blocks. One rule matters most:
**never write a raw colour** — always use a token, so light/dark and the tenant accent
stay correct everywhere.

## Where things live

| What | Where |
|---|---|
| Tokens, light/dark, Tailwind `@theme`, calendar entry colours | `src/styles/console.css` |
| Tenant name, initials and accent colour | `src/lib/tenant.svelte.ts` (Aust defaults, confirmed by `GET /api/v1/tenant`) |
| Theme store (`light` / `dark` / `system`, localStorage `aust_theme`) | `src/lib/stores/theme.svelte.ts` + pre-paint script in `src/app.html` |
| Shell: sidebar, phone tab bar, "Mehr" sheet, ⌘K palette, notes/feedback panels | `src/lib/components/console/` (`nav.ts` is the single nav source) |
| Primitives | `src/lib/components/ui/` |

`+layout.svelte` sets `data-console`, `data-theme` and `--accent` on `<html>`, so dialogs
portalled to `<body>` are themed too. The marketing site never loads `console.css`; the
root `+error.svelte` must stay import-free or global.css leaks into the console.

## Tokens → utilities

| Utility | Use |
|---|---|
| `bg-bg` / `bg-panel` / `bg-sunk` | page / cards and sheets / insets, hover rows, skeletons |
| `text-fg` / `text-muted` / `text-faint` | body / secondary / labels and hints |
| `border-line` / `border-line-strong` | dividers and cards / inputs and hover |
| `bg-accent text-accent-ink`, `text-accent-text` | primary action (tenant colour), accent-coloured text |
| `text-ok` `text-warn` `text-danger` `text-info` (+ `bg-*/10`) | status |
| `num` | mono, tabular figures — all money, dates, counts |
| `label-xs` | small uppercase mono label (KPI and section captions) |
| `entry-green` … `entry-appt` | calendar entry colours (both themes) |

Money is shown in full; KPI values scale with their tile (`cqi`) instead of truncating.

## Primitives (`lib/components/ui/`)

Button (variants `accent`, `solid`, `outline`, `ghost`, `danger`, `destructive`; sizes `xs`–`lg`, `icon*`),
Card, CardHeader, Panel (collapsible), Section, Kpi, Sparkline, Badge + `tone.ts`, CountBadge, Dot,
Field, Input, Select, Textarea, Check, Segmented, FilterTabs, SearchInput, Stepper,
PageHeader, EmptyState, Notice, Table, KeyValue, Modal (bottom sheet on phones), Sheet.

Shared admin components in `lib/components/admin/` (DataTable with phone card mode,
StatusBadge, ConfirmationDialog, LoadingButton, Toast, …) are built on these.

## Layout rules

- Mobile first. Phones: top bar + bottom tab bar, content padded for the tab bar and safe area.
  Desktop (`lg`): fixed sidebar. Side panels become bottom sheets below `md`.
- No horizontal page scroll at 390 px. Wide tables go inside `Table` (own scroll) or
  DataTable's card mode. Use `min-w-0` on grid/flex children that hold long text.
- Touch targets ≥ 40 px on phones.
- German for every user-facing string, with real umlauts (ä ö ü ß).

## Checking a change

`npm run check` and `npx vitest run`. For a visual pass, run the backend locally and
vite dev on port 5173, then screenshot light/dark/phone with Playwright from
`tests/e2e/node_modules`. Do not use `scripts/staging.sh` with uncommitted frontend
work — it checks out the frontend's `origin/main`.
