<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/utils/api.svelte';
	import { LogIn, KeyRound, ArrowLeft } from 'lucide-svelte';

	type View = 'login' | 'request' | 'verify';

	let view = $state<View>('login');
	let email = $state('');
	let password = $state('');

	// Password reset state
	let resetEmail = $state('');
	let resetOtp = $state('');
	let resetNewPassword = $state('');
	let resetConfirm = $state('');
	let resetLoading = $state(false);
	let resetError = $state('');
	let resetSuccess = $state('');

	/**
	 * Handles login form submission by calling the auth store login method.
	 *
	 * Called by: Template (form onsubmit event)
	 * Purpose: Prevents the default browser form submission, delegates credential validation
	 *          to auth.login() which POSTs to POST /api/v1/auth/login, and redirects to
	 *          the admin dashboard on success. Any error is surfaced via auth.error.
	 *
	 * @param e - The native DOM submit event
	 * @returns void
	 */
	async function handleSubmit(e: Event) {
		e.preventDefault();
		const success = await auth.login(email, password);
		if (success) {
			goto('/admin');
		}
	}

	/**
	 * Opens the reset flow and pre-fills the email from the login form if available.
	 *
	 * Called by: Template ("Passwort vergessen?" link click)
	 * Purpose: Smooth transition to reset flow without losing the email already typed.
	 */
	function openReset() {
		resetEmail = email;
		resetOtp = '';
		resetNewPassword = '';
		resetConfirm = '';
		resetError = '';
		resetSuccess = '';
		view = 'request';
	}

	/**
	 * Requests a password reset OTP for the entered email address.
	 *
	 * Called by: Template (form onsubmit in the request step)
	 * Purpose: POSTs to POST /api/v1/auth/reset-password/request. Always shows the verify
	 *          step regardless of whether the email exists, to prevent user enumeration.
	 *
	 * @param e - The native DOM submit event
	 * @returns void
	 */
	async function handleResetRequest(e: Event) {
		e.preventDefault();
		if (!resetEmail.trim()) { resetError = 'E-Mail ist erforderlich'; return; }
		resetError = '';
		resetLoading = true;
		try {
			await apiFetch('/api/v1/auth/reset-password/request', {
				method: 'POST',
				body: { email: resetEmail.trim() },
			});
			view = 'verify';
		} catch (err) {
			resetError = (err as Error).message;
		} finally {
			resetLoading = false;
		}
	}

	/**
	 * Submits the OTP and new password to complete the reset.
	 *
	 * Called by: Template (form onsubmit in the verify step)
	 * Purpose: POSTs to POST /api/v1/auth/reset-password/verify. On success shows a
	 *          confirmation and redirects back to the login view after 2 seconds.
	 *
	 * @param e - The native DOM submit event
	 * @returns void
	 */
	async function handleResetVerify(e: Event) {
		e.preventDefault();
		if (!resetOtp.trim()) { resetError = 'Code ist erforderlich'; return; }
		if (resetNewPassword.length < 8) { resetError = 'Passwort muss mindestens 8 Zeichen haben'; return; }
		if (resetNewPassword !== resetConfirm) { resetError = 'Passwörter stimmen nicht überein'; return; }
		resetError = '';
		resetLoading = true;
		try {
			await apiFetch('/api/v1/auth/reset-password/verify', {
				method: 'POST',
				body: { email: resetEmail.trim(), otp: resetOtp.trim(), new_password: resetNewPassword },
			});
			resetSuccess = 'Passwort erfolgreich geändert. Sie werden weitergeleitet...';
			setTimeout(() => { view = 'login'; email = resetEmail; }, 2000);
		} catch (err) {
			resetError = (err as Error).message;
		} finally {
			resetLoading = false;
		}
	}
</script>

<div class="login-page">
	<div class="login-card">

		{#if view === 'login'}
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

			<div class="forgot-row">
				<button class="forgot-link" onclick={openReset}>Passwort vergessen?</button>
			</div>

		{:else if view === 'request'}
			<div class="login-header">
				<div class="reset-icon"><KeyRound size={28} /></div>
				<h1>Passwort zurücksetzen</h1>
				<p>Geben Sie Ihre E-Mail ein. Sie erhalten einen 6-stelligen Code.</p>
			</div>

			<form onsubmit={handleResetRequest}>
				{#if resetError}
					<div class="login-error">{resetError}</div>
				{/if}

				<div class="field">
					<label for="reset-email">E-Mail</label>
					<input
						id="reset-email"
						type="email"
						bind:value={resetEmail}
						placeholder="admin@aust-umzuege.de"
						required
						autocomplete="email"
					/>
				</div>

				<button type="submit" class="login-btn" disabled={resetLoading}>
					{resetLoading ? 'Wird gesendet...' : 'Code senden'}
				</button>
			</form>

			<div class="forgot-row">
				<button class="forgot-link" onclick={() => view = 'login'}>
					<ArrowLeft size={14} /> Zurück zur Anmeldung
				</button>
			</div>

		{:else if view === 'verify'}
			<div class="login-header">
				<div class="reset-icon"><KeyRound size={28} /></div>
				<h1>Code eingeben</h1>
				<p>Wir haben einen Code an <strong>{resetEmail}</strong> gesendet.</p>
			</div>

			<form onsubmit={handleResetVerify}>
				{#if resetError}
					<div class="login-error">{resetError}</div>
				{/if}
				{#if resetSuccess}
					<div class="login-success">{resetSuccess}</div>
				{/if}

				<div class="field">
					<label for="reset-otp">6-stelliger Code</label>
					<input
						id="reset-otp"
						type="text"
						inputmode="numeric"
						bind:value={resetOtp}
						placeholder="123456"
						maxlength="6"
						required
						autocomplete="one-time-code"
					/>
				</div>

				<div class="field">
					<label for="reset-pw">Neues Passwort</label>
					<input
						id="reset-pw"
						type="password"
						bind:value={resetNewPassword}
						placeholder="Mindestens 8 Zeichen"
						required
						autocomplete="new-password"
					/>
				</div>

				<div class="field">
					<label for="reset-pw2">Passwort bestätigen</label>
					<input
						id="reset-pw2"
						type="password"
						bind:value={resetConfirm}
						placeholder="Passwort wiederholen"
						required
						autocomplete="new-password"
					/>
				</div>

				<button type="submit" class="login-btn" disabled={resetLoading || !!resetSuccess}>
					{resetLoading ? 'Wird gespeichert...' : 'Passwort ändern'}
				</button>
			</form>

			<div class="forgot-row">
				<button class="forgot-link" onclick={() => view = 'request'}>
					<ArrowLeft size={14} /> Code erneut senden
				</button>
			</div>
		{/if}

	</div>
</div>

<style>
	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: var(--dt-surface);
		padding: 1rem;
	}

	.login-card {
		width: 100%;
		max-width: 400px;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		box-shadow: var(--dt-shadow-ambient);
		padding: 2rem;
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.login-header h1 {
		color: var(--dt-primary);
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.login-header p {
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
	}

	.login-header p strong {
		color: var(--dt-on-surface);
	}

	.reset-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 0.75rem;
		color: var(--dt-primary);
	}

	.login-error {
		background: rgba(168, 57, 0, 0.08);
		color: var(--dt-secondary);
		padding: 0.75rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.login-success {
		background: rgba(22, 101, 52, 0.08);
		color: #166534;
		padding: 0.75rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.field {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.375rem;
	}

	input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-md);
		color: var(--dt-on-surface);
		font-size: 0.9375rem;
		outline: none;
		transition: background var(--dt-transition), border-color var(--dt-transition);
		box-sizing: border-box;
	}

	input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom-color: var(--dt-primary);
	}

	input::placeholder {
		color: var(--dt-outline-variant);
	}

	.login-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem var(--dt-space-6);
		margin-top: 0.5rem;
		background: linear-gradient(135deg, #022448, #1e3a5f);
		border: none;
		color: var(--dt-on-primary);
		font-weight: 600;
		font-size: 0.9375rem;
		border-radius: var(--dt-radius-md);
		cursor: pointer;
		transition: opacity var(--dt-transition);
	}

	.login-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.login-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.forgot-row {
		display: flex;
		justify-content: center;
		margin-top: 1.25rem;
	}

	.forgot-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8125rem;
		color: var(--dt-primary);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: opacity var(--dt-transition);
	}

	.forgot-link:hover {
		opacity: 0.75;
		text-decoration: underline;
	}
</style>
