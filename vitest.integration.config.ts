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
 */
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/integration/**/*.test.ts'],
		environment: 'node',
		globalSetup: ['./tests/integration/globalSetup.ts'],
		// Round-trips share backend state — run files and tests sequentially.
		fileParallelism: false,
		sequence: { concurrent: false },
		testTimeout: 30_000,
		hookTimeout: 60_000,
		env: {
			// Point the frontend API client at the local backend, never production.
			VITE_API_BASE: 'http://localhost:8080',
		},
	},
});
