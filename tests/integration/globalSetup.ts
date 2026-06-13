/**
 * Global setup for the integration suite.
 *
 * 1. Verifies the local backend is reachable — fails fast with a hint to
 *    start `bash scripts/dev-up.sh` otherwise (never falls back to prod).
 * 2. Seeds a dedicated test admin directly into the staging Postgres so the
 *    suite can log in on any fresh backup restore without secrets in the repo.
 */
import { Client } from 'pg';
import { hash } from '@node-rs/argon2';
import { API_BASE, DB_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from './config';

export default async function setup() {
	// 1. Backend reachable?
	try {
		const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
		if (!res.ok) throw new Error(`health returned ${res.status}`);
	} catch (e) {
		throw new Error(
			`Backend unter ${API_BASE} nicht erreichbar (${(e as Error).message}).\n` +
				`Integrationstests brauchen den lokalen Dev-Stack:\n` +
				`    bash scripts/dev-up.sh --no-frontend\n`
		);
	}

	// 2. Seed the test admin (idempotent upsert).
	const client = new Client({ connectionString: DB_URL });
	await client.connect();
	try {
		// Same algorithm family as the backend (argon2 crate defaults → argon2id PHC string).
		const passwordHash = await hash(ADMIN_PASSWORD);
		await client.query(
			`INSERT INTO users (email, password_hash, name, role)
			 VALUES ($1, $2, 'Integration Test Admin', 'admin')
			 ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
			[ADMIN_EMAIL, passwordHash]
		);
	} finally {
		await client.end();
	}
}
