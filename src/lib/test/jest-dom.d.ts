/**
 * Makes @testing-library/jest-dom's vitest matcher augmentations
 * (toBeInTheDocument, toHaveAttribute, …) visible to svelte-check/tsc.
 * The runtime registration happens in vitest-setup.ts, which lives outside
 * the src/ TypeScript program.
 */
import '@testing-library/jest-dom/vitest';
