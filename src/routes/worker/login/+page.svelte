<script lang="ts">
	import { goto } from '$app/navigation';
	import { worker } from '$lib/stores/worker.svelte';

	const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.aufraeumhelden.com';

	let email = $state('');
	let code = $state('');
	let step = $state<'email' | 'code'>('email');
	let loading = $state(false);
	let error = $state('');

	/**
	 * Sends an OTP request for the given email address.
	 *
	 * Called by: Template (email form submit).
	 * Purpose: Triggers POST /api/v1/employee/auth/request, then advances to
	 *          the code-entry step regardless of whether the email exists
	 *          (to avoid leaking registered emails).
	 */
	async function handleRequestOtp() {
		error = '';
		const trimmed = email.trim().toLowerCase();
		if (!trimmed || !trimmed.includes('@')) {
			error = 'Bitte eine gültige E-Mail-Adresse eingeben.';
			return;
		}

		loading = true;
		try {
			const res = await fetch(`${API_BASE}/api/v1/employee/auth/request`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: trimmed }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error((body as { message?: string }).message ?? 'Fehler beim Senden');
			}
			email = trimmed;
			step = 'code';
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Fehler beim Senden des Codes';
		} finally {
			loading = false;
		}
	}

	/**
	 * Verifies the OTP code and logs the worker in on success.
	 *
	 * Called by: Template (code form submit).
	 * Purpose: Calls POST /api/v1/employee/auth/verify, stores the session token
	 *          and employee profile, then navigates to the schedule page.
	 */
	async function handleVerifyOtp() {
		error = '';
		const trimmed = code.trim();
		if (trimmed.length !== 6) {
			error = 'Der Code muss 6 Stellen haben.';
			return;
		}

		loading = true;
		try {
			const res = await fetch(`${API_BASE}/api/v1/employee/auth/verify`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, code: trimmed }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error((body as { message?: string }).message ?? 'Ungültiger Code');
			}
			const data = await res.json();
			worker.login(data.token, data.employee);
			goto('/worker/schedule');
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Falscher oder abgelaufener Code';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Mitarbeiter Login | Aust Umzüge</title>
</svelte:head>

<div class="login-wrap">
	<div class="login-card">
		<div class="login-logo">
			<span class="logo-mark">AU</span>
		</div>
		<h1 class="login-title">Mitarbeiterportal</h1>
		<p class="login-sub">Aust Umzüge</p>

		{#if step === 'email'}
			<form onsubmit={(e) => { e.preventDefault(); handleRequestOtp(); }}>
				<div class="field">
					<label for="email">E-Mail-Adresse</label>
					<input
						id="email"
						type="email"
						autocomplete="email"
						placeholder="name@aust-umzuege.de"
						bind:value={email}
						disabled={loading}
					/>
				</div>
				{#if error}
					<p class="error">{error}</p>
				{/if}
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'Senden...' : 'Code senden'}
				</button>
			</form>
		{:else}
			<p class="code-hint">
				Ein 6-stelliger Code wurde an <strong>{email}</strong> gesendet.
			</p>
			<form onsubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
				<div class="field">
					<label for="code">Zugangscode</label>
					<input
						id="code"
						type="text"
						inputmode="numeric"
						autocomplete="one-time-code"
						maxlength={6}
						placeholder="123456"
						bind:value={code}
						disabled={loading}
					/>
				</div>
				{#if error}
					<p class="error">{error}</p>
				{/if}
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'Prüfen...' : 'Anmelden'}
				</button>
				<button type="button" class="btn-back" onclick={() => { step = 'email'; code = ''; error = ''; }}>
					Andere E-Mail verwenden
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.login-wrap {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f1f5f9;
		padding: 1.5rem;
	}

	.login-card {
		background: #fff;
		border-radius: 1rem;
		padding: 2rem 1.75rem;
		width: 100%;
		max-width: 360px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.login-logo {
		width: 56px;
		height: 56px;
		background: #1e293b;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.5rem;
	}

	.logo-mark {
		color: #fff;
		font-size: 1.25rem;
		font-weight: 800;
		letter-spacing: -0.03em;
	}

	.login-title {
		font-size: 1.375rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.login-sub {
		font-size: 0.875rem;
		color: #94a3b8;
		margin: 0 0 1rem;
	}

	form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #475569;
	}

	input {
		padding: 0.75rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 1rem;
		outline: none;
		transition: border-color 150ms;
		width: 100%;
	}

	input:focus {
		border-color: #4f46e5;
	}

	input:disabled {
		opacity: 0.6;
	}

	.code-hint {
		font-size: 0.875rem;
		color: #64748b;
		text-align: center;
		width: 100%;
		margin: 0;
	}

	.error {
		font-size: 0.8125rem;
		color: #dc2626;
		text-align: center;
		margin: 0;
	}

	.btn-primary {
		padding: 0.75rem;
		background: #4f46e5;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 150ms;
		width: 100%;
	}

	.btn-primary:hover:not(:disabled) {
		background: #4338ca;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-back {
		background: none;
		border: none;
		color: #94a3b8;
		font-size: 0.8125rem;
		cursor: pointer;
		text-align: center;
		padding: 0.25rem;
	}

	.btn-back:hover {
		color: #64748b;
	}
</style>
