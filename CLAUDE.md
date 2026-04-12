# frontend — SvelteKit Umzugsplattform

> **Full context**: [AGENTS.md](AGENTS.md)

One SvelteKit build, three audiences:
- **Marketing website** → [MARKETING.md](MARKETING.md) — SEO, prerendered, public
- **Admin dashboard** → [src/routes/admin/AGENTS.md](src/routes/admin/AGENTS.md) — JWT SPA, internal
- **Worker self-service** — `/worker/*` — JWT SPA, employee clock-in/out

Stack: SvelteKit 5 + Tailwind + adapter-static. German for all user-facing strings.

See [AGENTS.md](AGENTS.md) for directory layout, shared infrastructure, and deployment.