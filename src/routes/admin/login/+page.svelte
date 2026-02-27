<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { LogIn } from 'lucide-svelte';

	let email = $state('');
	let password = $state('');

	/**
	 * Handles login form submission by calling the auth store login method.
	 *
	 * Called by: Template (form onsubmit event)
	 * Purpose: Prevents the default browser form submission, delegates credential validation
	 *          to auth.login() which POSTs to POST /api/v1/auth/login, and redirects to
	 *          the admin dashboard on success. Any error is surfaced via auth.error.
	 *
	 * @param e - The native DOM submit event (used to call preventDefault)
	 * @returns void
	 */
	async function handleSubmit(e: Event) {
		e.preventDefault();
		const success = await auth.login(email, password);
		if (success) {
			goto('/admin');
		}
	}
</script>

<div class="login-page">
	<div class="login-card">
		<div class="login-header">
			<h1>AUST Admin</h1>
			<p>Melden Sie sich an, um fortzufahren</p>
		</div>

		<form onsubmit={handleSubmit}>
			{#if auth.error}
				<div class="login-error">{auth.error}</div>
			{/if}

			<div class="field">
				<label for="email">E-Mail</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="admin@aust-umzuege.de"
					required
					autocomplete="email"
				/>
			</div>

			<div class="field">
				<label for="password">Passwort</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Passwort eingeben"
					required
					autocomplete="current-password"
				/>
			</div>

			<button type="submit" class="login-btn" disabled={auth.loading}>
				{#if auth.loading}
					Anmeldung...
				{:else}
					<LogIn size={18} />
					Anmelden
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: #e8ecf1;
		padding: 1rem;
	}

	.login-card {
		width: 100%;
		max-width: 400px;
		background: #ffffff;
		border: none;
		border-radius: 16px;
		box-shadow: 8px 8px 20px #d1d9e6, -8px -8px 20px #ffffff;
		padding: 2rem;
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.login-header h1 {
		color: #1a1a2e;
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.login-header p {
		color: #64748b;
		font-size: 0.875rem;
	}

	.login-error {
		background: #fee2e2;
		border: none;
		color: #991b1b;
		padding: 0.75rem;
		border-radius: 10px;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.field {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #475569;
		margin-bottom: 0.375rem;
	}

	input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: #e8ecf1;
		border: none;
		border-radius: 10px;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
		color: #1a1a2e;
		font-size: 0.9375rem;
		outline: none;
		transition: box-shadow 150ms ease;
	}

	input:focus {
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff,
			0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	input::placeholder {
		color: #94a3b8;
	}

	.login-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		margin-top: 0.5rem;
		background: #6366f1;
		border: none;
		color: #ffffff;
		font-weight: 600;
		font-size: 0.9375rem;
		border-radius: 10px;
		box-shadow: 3px 3px 10px rgba(99, 102, 241, 0.3);
		cursor: pointer;
		transition: background 150ms ease;
	}

	.login-btn:hover:not(:disabled) {
		background: #4f46e5;
	}

	.login-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
