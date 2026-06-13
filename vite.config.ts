/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), svelteTesting()],
	test: {
		include: ['src/**/*.test.ts'],
		// jsdom so component tests can render; pure-logic tests run fine under it too
		environment: 'jsdom',
		setupFiles: ['./vitest-setup.ts'],
		// userEvent-heavy form tests stretch well past the 5s default when all
		// 60+ files run in parallel on a loaded machine
		testTimeout: 60_000,
		// $app/* stubbing happens via vi.mock in vitest-setup.ts — a Vite alias
		// cannot override the sveltekit() plugin's pre-enforced resolution.
	},
});
