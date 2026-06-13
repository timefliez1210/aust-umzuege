# Testing

Two suites, two purposes:

| Suite | Command | Needs | What it covers |
|---|---|---|---|
| Unit / component | `npm test` | nothing | utils, stores, Svelte components rendered in jsdom with mocked `fetch` |
| Integration | `npm run test:integration` | local dev stack | real round-trips: frontend API client → backend on `:8080` → Postgres → read-back. Emails asserted via Mailpit |

## Integration prerequisites

```bash
bash ../scripts/dev-up.sh --no-frontend   # staging postgres/minio/mailpit + backend :8080
npm run test:integration
```

- The suite **fails fast** if `http://localhost:8080/health` is unreachable — it never falls back to production.
- Global setup seeds `admin@integration-test.invalid` (Argon2) directly into the staging Postgres, so it works on any fresh backup restore.
- All records the suite creates use emails under `integration-test.invalid`; cleanup hard-deletes created inquiries (cascades), employees, and customers afterwards.
- Worker OTP codes and sent invoices are read from the Mailpit REST API (`:8025`).

## Formerly red tests — all fixed 2026-06-13

The suite was built with five tests encoding documented-but-broken behaviour.
All five underlying bugs are now fixed; the tests remain as regression guards:

1. **StructuredData array schemas** — now renders one JSON-LD script per entry.
2. **StatusBadge** — `info_requested` and `expired` translations added.
3. **Worker clock-out input** — the "Ende" field now exists on the job page.
4. **Manual-price invoices** (backend) — invoices persist `base_netto_cents`
   at creation (additive migration `20260613000000`); PDF regeneration and
   totals no longer depend on an active offer existing.
5. **Worker clock columns** (backend) — `PATCH /employee/jobs/{id}/clock` now
   writes `employee_clock_in/out` (TIMESTAMPTZ, migration 20260322 intent)
   instead of overwriting the admin's `clock_in/clock_out`; the job detail
   returns RFC3339 employee timestamps and computes `employee_actual_hours`
   from them.

## Infra fixes made for the integration suite (backend)

- **`smtp_tls` config option** (`AUST__EMAIL__SMTP_TLS`, default `"starttls"`).
  `"none"` uses plaintext SMTP without AUTH — required because Mailpit
  advertises neither STARTTLS nor AUTH. Without it, **no staging/dev email was
  ever delivered** (OTP login and invoice sending silently 500'd). Set in
  `docker/docker-compose.staging.yml` and `scripts/dev-up.sh`.
- **`dev-up.sh` FROM name**: `"AUST Umzüge (Dev)"` → `"AUST Umzüge Dev"`.
  Parentheses are RFC5322 comments; lettre rejected the From mailbox, which
  also blocked all dev email.

## Conventions

- Component tests live next to the component (`Foo.test.ts` beside `Foo.svelte`);
  route tests as `page.test.ts` / `layout.test.ts` beside the route file.
- `$app/stores` / `$app/navigation` are stubbed via `vi.mock` in
  `vitest-setup.ts` (see `src/lib/test/`). Use `setTestUrl('/path')` to fake
  navigation state and `vi.mocked(goto)` to assert redirects.
- Integration helpers (`tests/integration/helpers.ts`) drive the **real**
  frontend API client (`$lib/utils/api.svelte` + auth store) so the tests
  exercise the same code paths as the admin UI.
- Test priorities: depth on forms, admin, and worker logic; smoke-level for
  static marketing content.
