# frontend — SvelteKit Admin Dashboard

> **Full context**: [AGENTS.md](AGENTS.md)

SvelteKit + Tailwind, `adapter-static`, JWT auth against Rust API. Admin SPA at `/admin/*`.

**Key**: All API calls via `$lib/utils/api.svelte.ts`. Money in cents → `formatEuro()`. German locale. Svelte 5 runes.

See [AGENTS.md](AGENTS.md) for: directory layout, API integration, key patterns, running instructions.

For admin module specifics, see [src/routes/admin/AGENTS.md](src/routes/admin/AGENTS.md).