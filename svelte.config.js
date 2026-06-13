import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'admin.html',
			precompress: true,
			strict: false
		}),
		paths: {
			relative: false
		},
		version: {
			// Poll version.json so long-running sessions (workers keep the
			// portal open for days) detect redeploys and hard-navigate instead
			// of failing to lazy-load replaced immutable chunks.
			pollInterval: 60_000
		}
	}
};

export default config;
