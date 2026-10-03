import { apiGet } from '$lib/utils/api.svelte';
import type { BadgeKey } from './nav';

/**
 * Navigation counters, polled once for the whole shell (sidebar, tab bar, "Mehr").
 *
 * Why a minute: these are ambient hints (feedback report dc7515c2) — Telegram is
 * what chases anything urgent. A failed poll keeps the last known counts.
 */
class NavBadges {
	counts = $state<Record<BadgeKey, number>>({
		flash_contacts: 0,
		unread_emails: 0,
		new_inquiries: 0,
		kva_followups: 0
	});

	async refresh() {
		try {
			this.counts = await apiGet<Record<BadgeKey, number>>('/api/v1/admin/nav-badges');
		} catch {
			// keep last known counts
		}
	}

	/** Starts polling; returns the stop function (use as an $effect cleanup). */
	start(): () => void {
		this.refresh();
		const id = setInterval(() => this.refresh(), 60_000);
		return () => clearInterval(id);
	}

	get(key: BadgeKey | undefined): number {
		return key ? this.counts[key] : 0;
	}
}

export const navBadges = new NavBadges();
