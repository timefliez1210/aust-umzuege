/** Shared constants for the integration suite (overridable via env). */

export const API_BASE = process.env.INTEGRATION_API_BASE ?? 'http://localhost:8080';

/** Staging Postgres from scripts/dev-up.sh. */
export const DB_URL =
	process.env.INTEGRATION_DB_URL ??
	'postgres://aust_staging:aust_staging_password@localhost:5435/aust_staging';

/** Mailpit REST API (captures all SMTP from the local backend). */
export const MAILPIT_BASE = process.env.INTEGRATION_MAILPIT_BASE ?? 'http://localhost:8025';

/**
 * Marker domain: every record the suite creates uses an email under this
 * domain (or a name containing it) so stray rows are recognizable and the
 * cleanup helper can remove them from the shared staging DB.
 */
export const TEST_DOMAIN = 'integration-test.invalid';

export const ADMIN_EMAIL = `admin@${TEST_DOMAIN}`;
export const ADMIN_PASSWORD = 'integration-test-password-1234';
