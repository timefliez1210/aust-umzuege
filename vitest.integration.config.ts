/// <reference types="vitest/config" />
/**
 * Integration test config — real round-trips against the LOCAL backend.
 *
 * Prerequisite: the dev stack must be running:
 *   bash ../scripts/dev-up.sh --no-frontend
 *
 * Tests talk to http://localhost:8080 (backend), localhost:5435 (staging
 * Postgres, for seeding the test admin + cleanup) and localhost:8025
 * (Mailpit REST API, for OTP codes and sent invoices).
 *
 * Run with: npm run test:integration
 *
 * `*.manual.test.ts` files are EXCLUDED here — they have outward side effects
 * (e.g. flash-contact fires a real Telegram ping per POST). Run them on demand
 * with `npm run test:integration:manual` (vitest.integration.manual.config.ts).
 */
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/integration/**/*.test.ts'],
		exclude: [...configDefaults.exclude, 'tests/integration/**/*.manual.test.ts'],
		environment: 'node',
		globalSetup: ['./tests/integration/globalSetup.ts'],
		// Round-trips share backend state — run files and tests sequentially.
		fileParallelism: false,
		sequence: { concurrent: false },
		testTimeout: 30_000,
		hookTimeout: 90_000,
		env: {
			// Point the frontend API client at the local backend, never production.
			VITE_API_BASE: 'http://localhost:8080',
		},
	},
});
