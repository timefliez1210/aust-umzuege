import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// SvelteKit runtime modules need an app/router context that doesn't exist in
// unit tests. vi.mock intercepts at the test-runner level — a plain Vite
// resolve.alias cannot override the sveltekit() plugin's pre-enforced
// resolution of `$app/*`. Stub implementations live in src/lib/test/.
vi.mock('$app/stores', () => import('./src/lib/test/app-stores'));
vi.mock('$app/navigation', () => import('./src/lib/test/app-navigation'));
