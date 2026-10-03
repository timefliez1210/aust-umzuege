import { browser } from '$app/environment';

/** What the user picked. `system` follows the device's light/dark setting. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Shared with the pre-paint script in app.html — keep the two in sync. */
export const THEME_KEY = 'aust_theme';

function readMode(): ThemeMode {
	if (!browser) return 'system';
	try {
		const raw = localStorage.getItem(THEME_KEY);
		return raw === 'light' || raw === 'dark' ? raw : 'system';
	} catch {
		return 'system';
	}
}

function systemPrefersDark(): boolean {
	return browser && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Light/dark preference for the console.
 *
 * Called by: admin layout (apply on mount), the sidebar / "Mehr" sheet toggles.
 * Why: SaaS customers pick their own look; the choice is per device for now
 * (localStorage) and is applied to <html data-theme> so portals (dialogs, sheets)
 * rendered under <body> inherit it too. app.html applies the same value before the
 * first paint, so a reload never flashes the wrong theme.
 */
class ThemeStore {
	mode = $state<ThemeMode>(readMode());
	#systemDark = $state(systemPrefersDark());

	/** The theme actually shown. */
	resolved = $derived<'light' | 'dark'>(
		this.mode === 'system' ? (this.#systemDark ? 'dark' : 'light') : this.mode
	);

	constructor() {
		if (!browser) return;
		window
			.matchMedia('(prefers-color-scheme: dark)')
			.addEventListener('change', (e) => (this.#systemDark = e.matches));
	}

	set(mode: ThemeMode) {
		this.mode = mode;
		try {
			if (mode === 'system') localStorage.removeItem(THEME_KEY);
			else localStorage.setItem(THEME_KEY, mode);
		} catch {
			// Private mode / blocked storage: the choice still holds for this session.
		}
	}

	toggle() {
		this.set(this.resolved === 'dark' ? 'light' : 'dark');
	}

	/** Writes the resolved theme onto <html>. Call from an $effect so it tracks changes. */
	apply() {
		if (!browser) return;
		const html = document.documentElement;
		html.dataset.console = '';
		html.dataset.theme = this.resolved;
	}
}

export const theme = new ThemeStore();
