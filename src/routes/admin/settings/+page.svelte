<script lang="ts">
	import { apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { KeyRound } from 'lucide-svelte';
	import PricingSettingsCard from './_components/PricingSettingsCard.svelte';
	import UserManagementCard from './_components/UserManagementCard.svelte';

	// Change password
	let currentPw = $state('');
	let changePw = $state('');
	let confirmPw = $state('');
	let changingPassword = $state(false);

	/**
	 * Handles the change-password form submission and updates the current user's password.
	 *
	 * Called by: Template (change-password form onsubmit event)
	 * Purpose: Validates that the new password and its confirmation match, then POSTs to
	 *          POST /api/v1/auth/change-password with the current and new passwords.
	 *          On success all three password fields are cleared so the form is ready for
	 *          future use; on mismatch a toast error is shown before the API call.
	 *
	 * @param e - The native DOM submit event (used to call preventDefault)
	 * @returns void
	 */
	async function handleChangePassword(e: Event) {
		e.preventDefault();
		if (changePw !== confirmPw) {
			showToast('Passwoerter stimmen nicht ueberein', 'error');
			return;
		}
		changingPassword = true;
		try {
			await apiPost('/api/v1/auth/change-password', {
				current_password: currentPw,
				new_password: changePw
			});
			showToast('Passwort erfolgreich geaendert', 'success');
			currentPw = '';
			changePw = '';
			confirmPw = '';
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Aendern', 'error');
		} finally {
			changingPassword = false;
		}
	}
</script>

<div class="settings-page">
	<div class="page-header">
		<h1>Einstellungen</h1>
	</div>

	<PricingSettingsCard />

	<!-- Change Password Card -->
	<div class="card">
		<div class="card-header">
			<KeyRound size={20} />
			<h2>Passwort aendern</h2>
		</div>

		<form class="create-form" onsubmit={handleChangePassword}>
			<div class="field">
				<label for="current-pw">Aktuelles Passwort</label>
				<input
					id="current-pw"
					type="password"
					bind:value={currentPw}
					placeholder="Aktuelles Passwort"
					required
					autocomplete="current-password"
				/>
			</div>
			<div class="form-row">
				<div class="field">
					<label for="new-pw">Neues Passwort</label>
					<input
						id="new-pw"
						type="password"
						bind:value={changePw}
						placeholder="Mindestens 8 Zeichen"
						minlength={8}
						required
						autocomplete="new-password"
					/>
				</div>
				<div class="field">
					<label for="confirm-pw">Passwort bestaetigen</label>
					<input
						id="confirm-pw"
						type="password"
						bind:value={confirmPw}
						placeholder="Passwort wiederholen"
						minlength={8}
						required
						autocomplete="new-password"
					/>
				</div>
			</div>
			<button type="submit" class="btn-create" disabled={changingPassword}>
				{#if changingPassword}
					Wird geaendert...
				{:else}
					<KeyRound size={16} />
					Passwort aendern
				{/if}
			</button>
		</form>
	</div>

	<UserManagementCard />
</div>

<style>
	.settings-page {
		max-width: 800px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.card {
		box-shadow: none;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
		color: var(--dt-on-surface);
	}

	.card-header h2 {
		font-size: 1.0625rem;
		font-weight: 600;
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.field input {
		padding: 0.625rem 0.75rem;
		font-size: 0.9375rem;
	}

	.btn-create {
		padding: 0.75rem var(--dt-space-6);
		font-size: 0.9375rem;
		align-self: flex-start;
		justify-content: center;
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
