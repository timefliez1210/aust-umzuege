/**
 * The company this console belongs to.
 *
 * Single-tenant today, so it is a constant. When the console becomes a SaaS this
 * comes from the tenant's settings (name, mark, accent colour, logo) and the accent
 * is written to `--accent` on <html> — components already read only the variable.
 */
export const tenant = {
	name: 'Aust Umzüge',
	mark: 'AU',
	place: 'Hildesheim',
	accent: '#ff5a1f'
} as const;
