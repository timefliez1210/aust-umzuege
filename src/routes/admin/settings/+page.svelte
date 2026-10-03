<script lang="ts">
	import { apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { KeyRound } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ThemeToggle from '$lib/components/console/ThemeToggle.svelte';
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
			showToast('Passwörter stimmen nicht überein', 'error');
			return;
		}
		changingPassword = true;
		try {
			await apiPost('/api/v1/auth/change-password', {
				current_password: currentPw,
				new_password: changePw
			});
			showToast('Passwort erfolgreich geändert', 'success');
			currentPw = '';
			changePw = '';
			confirmPw = '';
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Ändern', 'error');
		} finally {
			changingPassword = false;
		}
	}
</script>

<svelte:head><title>Einstellungen</title></svelte:head>

<PageHeader title="Einstellungen" />

<div class="grid items-start gap-3.5 xl:grid-cols-2">
	<div class="flex min-w-0 flex-col gap-3.5">
		<PricingSettingsCard />
	</div>
	<div class="flex min-w-0 flex-col gap-3.5">
		<Panel title="Darstellung">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<p class="text-[13px] text-muted">Hell oder dunkel — gilt für dieses Gerät.</p>
				<ThemeToggle class="w-56" />
			</div>
		</Panel>

		<UserManagementCard />

		<Panel title="Passwort ändern">
			<form class="grid gap-3 sm:grid-cols-2" onsubmit={handleChangePassword}>
				<Field label="Aktuelles Passwort" for="current-pw" class="sm:col-span-2">
					<Input id="current-pw" type="password" bind:value={currentPw} placeholder="Aktuelles Passwort" required autocomplete="current-password" />
				</Field>
				<Field label="Neues Passwort" for="new-pw">
					<Input id="new-pw" type="password" bind:value={changePw} placeholder="Mindestens 8 Zeichen" minlength={8} required autocomplete="new-password" />
				</Field>
				<Field label="Passwort bestätigen" for="confirm-pw">
					<Input id="confirm-pw" type="password" bind:value={confirmPw} placeholder="Passwort wiederholen" minlength={8} required autocomplete="new-password" />
				</Field>
				<Button type="submit" variant="solid" class="self-start" disabled={changingPassword}>
					{#if changingPassword}Wird geändert …{:else}<KeyRound size={15} /> Passwort ändern{/if}
				</Button>
			</form>
		</Panel>
	</div>
</div>
