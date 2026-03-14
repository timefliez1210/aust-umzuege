<script lang="ts">
	import { worker } from '$lib/stores/worker.svelte';
	import { goto } from '$app/navigation';
	import { LogOut, User, Mail, Phone } from 'lucide-svelte';

	/**
	 * Logs the worker out and redirects to the login page.
	 *
	 * Called by: Template (logout button).
	 * Purpose: Clears session credentials from localStorage.
	 */
	function handleLogout() {
		worker.logout();
		goto('/worker/login');
	}

	function initials(first: string, last: string): string {
		return (first[0] ?? '') + (last[0] ?? '');
	}
</script>

<svelte:head>
	<title>Profil | Aust Mitarbeiter</title>
</svelte:head>

{#if worker.employee}
	{@const emp = worker.employee}
	<div class="profile-avatar">
		<span class="avatar-initials">{initials(emp.first_name, emp.last_name)}</span>
	</div>

	<h1 class="profile-name">{emp.first_name} {emp.last_name}</h1>

	<div class="info-card">
		<div class="info-row">
			<Mail size={16} class="info-icon" />
			<span class="info-value">{emp.email}</span>
		</div>
		{#if emp.phone}
			<div class="info-row">
				<Phone size={16} class="info-icon" />
				<a class="info-link" href="tel:{emp.phone}">{emp.phone}</a>
			</div>
		{/if}
	</div>

	<button class="logout-btn" onclick={handleLogout}>
		<LogOut size={16} />
		Abmelden
	</button>
{:else}
	<div class="empty">Kein Profil geladen.</div>
{/if}

<style>
	.profile-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 72px;
		height: 72px;
		background: #1e293b;
		border-radius: 50%;
		margin: 1rem auto 0.75rem;
	}

	.avatar-initials {
		color: #fff;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}

	.profile-name {
		text-align: center;
		font-size: 1.25rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 1.5rem;
	}

	.info-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.info-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.875rem 1rem;
		border-bottom: 1px solid #f1f5f9;
		font-size: 0.9375rem;
		color: #334155;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	:global(.info-icon) {
		color: #94a3b8;
		flex-shrink: 0;
	}

	.info-value {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.info-link {
		color: #4f46e5;
		text-decoration: none;
	}

	.info-link:hover {
		text-decoration: underline;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
		background: #fff;
		border: 1.5px solid #e2e8f0;
		border-radius: 0.75rem;
		color: #64748b;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 150ms, color 150ms;
	}

	.logout-btn:hover {
		background: #fee2e2;
		border-color: #fecaca;
		color: #dc2626;
	}

	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: #94a3b8;
		font-size: 0.9375rem;
	}
</style>
