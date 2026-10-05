<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/utils/api.svelte';
	import { LogIn, ArrowLeft } from 'lucide-svelte';
	import { tenant } from '$lib/tenant.svelte';
	import TenantMark from '$lib/components/console/TenantMark.svelte';
	import ThemeButton from '$lib/components/console/ThemeButton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';

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

<svelte:head><title>Anmelden · {tenant.name}</title></svelte:head>

<div class="relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10 text-fg">
	<ThemeButton class="absolute top-4 right-4" />

	<div class="w-full max-w-sm">
		<div class="mb-8 flex items-center gap-3">
			<TenantMark class="size-10 text-sm" />
			<span class="flex flex-col">
				<span class="text-base font-semibold">{tenant.name}</span>
				<span class="label-xs text-faint">Console</span>
			</span>
		</div>

		{#if view === 'login'}
			<h1 class="text-[28px] leading-tight font-semibold tracking-[-0.03em]">Anmelden</h1>
			<p class="mt-1 mb-6 text-sm text-muted">Melden Sie sich an, um fortzufahren.</p>

			<form class="flex flex-col gap-4" onsubmit={handleSubmit}>
				{#if auth.error}<Notice tone="danger">{auth.error}</Notice>{/if}
				<Field label="E-Mail" for="email">
					<Input id="email" type="email" class="h-11" bind:value={email} placeholder="name@firma.de" required autocomplete="email" />
				</Field>
				<Field label="Passwort" for="password">
					<Input
						id="password"
						type="password"
						class="h-11"
						bind:value={password}
						placeholder="Passwort eingeben"
						required
						autocomplete="current-password"
					/>
				</Field>
				<Button type="submit" variant="accent" size="lg" class="mt-1" disabled={auth.loading}>
					{#if auth.loading}Anmeldung …{:else}<LogIn size={18} /> Anmelden{/if}
				</Button>
			</form>

			<button class="mt-5 text-[13px] text-muted hover:text-fg hover:underline" onclick={openReset}>Passwort vergessen?</button>
		{:else if view === 'request'}
			<h1 class="text-[28px] leading-tight font-semibold tracking-[-0.03em]">Passwort zurücksetzen</h1>
			<p class="mt-1 mb-6 text-sm text-muted">Geben Sie Ihre E-Mail ein. Sie erhalten einen 6-stelligen Code.</p>

			<form class="flex flex-col gap-4" onsubmit={handleResetRequest}>
				{#if resetError}<Notice tone="danger">{resetError}</Notice>{/if}
				<Field label="E-Mail" for="reset-email">
					<Input id="reset-email" type="email" class="h-11" bind:value={resetEmail} placeholder="name@firma.de" required autocomplete="email" />
				</Field>
				<Button type="submit" variant="accent" size="lg" disabled={resetLoading}>{resetLoading ? 'Wird gesendet …' : 'Code senden'}</Button>
			</form>

			<button class="mt-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg" onclick={() => (view = 'login')}>
				<ArrowLeft size={14} /> Zurück zur Anmeldung
			</button>
		{:else if view === 'verify'}
			<h1 class="text-[28px] leading-tight font-semibold tracking-[-0.03em]">Code eingeben</h1>
			<p class="mt-1 mb-6 text-sm text-muted">Wir haben einen Code an <strong class="text-fg">{resetEmail}</strong> gesendet.</p>

			<form class="flex flex-col gap-4" onsubmit={handleResetVerify}>
				{#if resetError}<Notice tone="danger">{resetError}</Notice>{/if}
				{#if resetSuccess}<Notice>{resetSuccess}</Notice>{/if}
				<Field label="6-stelliger Code" for="reset-otp">
					<Input
						id="reset-otp"
						inputmode="numeric"
						class="num h-11 text-center text-lg tracking-[0.4em]"
						bind:value={resetOtp}
						placeholder="123456"
						maxlength={6}
						required
						autocomplete="one-time-code"
					/>
				</Field>
				<Field label="Neues Passwort" for="reset-pw">
					<Input id="reset-pw" type="password" class="h-11" bind:value={resetNewPassword} placeholder="Mindestens 8 Zeichen" required autocomplete="new-password" />
				</Field>
				<Field label="Passwort bestätigen" for="reset-pw2">
					<Input id="reset-pw2" type="password" class="h-11" bind:value={resetConfirm} placeholder="Passwort wiederholen" required autocomplete="new-password" />
				</Field>
				<Button type="submit" variant="accent" size="lg" disabled={resetLoading || !!resetSuccess}>
					{resetLoading ? 'Wird gespeichert …' : 'Passwort ändern'}
				</Button>
			</form>

			<button class="mt-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg" onclick={() => (view = 'request')}>
				<ArrowLeft size={14} /> Code erneut senden
			</button>
		{/if}
	</div>
</div>
