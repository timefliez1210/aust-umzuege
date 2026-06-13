/// <reference types="vitest/config" />
/**
 * MANUAL integration config — runs ONLY `*.manual.test.ts` files.
 *
 * These suites have real-world side effects (e.g. flash-contact fires a Telegram
 * ping to Alex on every accepted POST) and are therefore excluded from the
 * default `npm run test:integration`. Run them deliberately:
 *
 *     npm run test:integration:manual
 *
 * Same prerequisites as the default suite: the local dev stack must be up
 * (`bash ../scripts/dev-up.sh --no-frontend`). Keep the `test` block below in
 * sync with vitest.integration.config.ts.
 */
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/integration/**/*.manual.test.ts'],
		environment: 'node',
		globalSetup: ['./tests/integration/globalSetup.ts'],
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
