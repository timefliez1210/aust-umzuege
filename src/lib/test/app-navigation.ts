/**
 * Test stub for `$app/navigation` (aliased in vite.config.ts when VITEST is set).
 *
 * `goto` is a spy so tests can assert redirects:
 *
 *   import { goto } from '$app/navigation';
 *   expect(goto).toHaveBeenCalledWith('/admin/login');
 *
 * Reset between tests with `vi.mocked(goto).mockClear()` (the global test
 * setup does not auto-clear module-level spies).
 */
import { vi } from 'vitest';

export const goto = vi.fn(async (_url: string | URL, _opts?: unknown) => {});
export const invalidate = vi.fn(async () => {});
export const invalidateAll = vi.fn(async () => {});
export const preloadData = vi.fn(async () => ({}) as unknown);
export const preloadCode = vi.fn(async () => {});
export const onNavigate = vi.fn(() => () => {});
export const beforeNavigate = vi.fn(() => {});
export const afterNavigate = vi.fn(() => {});
export const pushState = vi.fn(() => {});
export const replaceState = vi.fn(() => {});
export const disableScrollHandling = vi.fn(() => {});
