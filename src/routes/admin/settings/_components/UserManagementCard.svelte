<script lang="ts">
	import { apiGet, apiPost, formatDateTime } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { UserPlus, Shield, Trash2 } from 'lucide-svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';

	interface UserItem {
		id: string;
		email: string;
		name: string;
		role: string;
		created_at: string;
	}

	let users = $state<UserItem[]>([]);
	let loading = $state(true);

	// New user form
	let newName = $state('');
	let newEmail = $state('');
	let newPassword = $state('');
	let newRole = $state<'admin' | 'operator'>('admin');
	let creating = $state(false);

	// Confirm modal
	let confirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmMessage = $state('');
	let confirmAction = $state<(() => Promise<void>) | null>(null);
	let confirmLoading = $state(false);

	$effect(() => {
		loadUsers();
	});

	/**
	 * Fetches the list of all admin users from the API.
	 *
	 * Called by: $effect (on mount), handleCreate, requestDeleteUser (via executeConfirm)
	 * Purpose: Populates the users list card via GET /api/v1/admin/users so the admin can
	 *          see every registered account along with their role and creation date.
	 *
	 * @returns void
	 */
	async function loadUsers() {
		try {
			const data = await apiGet<{ users: UserItem[] }>('/api/v1/admin/users');
			users = data.users;
		} catch {
			users = [];
		} finally {
			loading = false;
		}
	}

	/**
	 * Handles the new-user form submission and registers the account via the API.
	 *
	 * Called by: Template (create-user form onsubmit event)
	 * Purpose: Validates that name, email, and password are all non-empty, then POSTs to
	 *          POST /api/v1/auth/register to create the new account with the selected role.
	 *          On success the form is cleared and the user list reloaded.
	 *
	 * @param e - The native DOM submit event (used to call preventDefault)
	 * @returns void
	 */
	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;

		creating = true;
		try {
			await apiPost('/api/v1/auth/register', {
				name: newName.trim(),
				email: newEmail.trim(),
				password: newPassword,
				role: newRole
			});
			showToast(`Benutzer "${newName.trim()}" erstellt`, 'success');
			newName = '';
			newEmail = '';
			newPassword = '';
			newRole = 'admin';
			await loadUsers();
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Erstellen', 'error');
		} finally {
			creating = false;
		}
	}

	/**
	 * Opens the confirmation modal configured to delete the specified user.
	 *
	 * Called by: Template (trash icon button click on a user row)
	 * Purpose: Prepopulates the shared confirm modal with a user-specific title and message,
	 *          then wires the confirm action to POST /api/v1/admin/users/{id}/delete followed
	 *          by a user list refresh, protecting against accidental deletion.
	 *
	 * @param user - The UserItem whose account should be deleted on confirmation
	 * @returns void
	 */
	function requestDeleteUser(user: UserItem) {
		openConfirm(
			`Benutzer loeschen`,
			`"${user.name || user.email}" wirklich dauerhaft loeschen?`,
			async () => {
				await apiPost(`/api/v1/admin/users/${user.id}/delete`);
				showToast('Benutzer geloescht', 'success');
				await loadUsers();
			}
		);
	}

	// Confirm modal helpers
	/**
	 * Opens the shared confirmation modal with the provided title, message, and async action.
	 *
	 * Called by: requestDeleteUser
	 * Purpose: Centralises modal state setup so multiple destructive actions across the
	 *          settings page can reuse the same confirm/cancel UI without duplicating markup.
	 *
	 * @param title - Heading text displayed inside the modal
	 * @param message - Body text explaining what will be deleted or changed
	 * @param action - Async callback executed when the admin clicks the confirm button
	 * @returns void
	 */
	function openConfirm(title: string, message: string, action: () => Promise<void>) {
		confirmTitle = title;
		confirmMessage = message;
		confirmAction = action;
		confirmLoading = false;
		confirmOpen = true;
	}

	/**
	 * Closes the confirmation modal and clears its action callback.
	 *
	 * Called by: Template (modal "Abbrechen" button click, backdrop click, Escape keydown via handleKeydown)
	 * Purpose: Hides the confirm dialog and nullifies the stored action so a stale callback
	 *          cannot be triggered if the modal is reopened for a different operation.
	 *
	 * @returns void
	 */
	function closeConfirm() {
		confirmOpen = false;
		confirmAction = null;
	}

	/**
	 * Executes the action stored in the confirmation modal and closes the modal on completion.
	 *
	 * Called by: Template (modal "Unwiderruflich loeschen" confirm button click)
	 * Purpose: Runs the async action registered by openConfirm (e.g. delete API call),
	 *          shows a toast on error, and always closes the modal in the finally block
	 *          regardless of success or failure.
	 *
	 * @returns void
	 */
	async function executeConfirm() {
		if (!confirmAction) return;
		confirmLoading = true;
		try {
			await confirmAction();
		} catch (e) {
			showToast((e as Error).message || 'Aktion fehlgeschlagen', 'error');
		} finally {
			confirmLoading = false;
			closeConfirm();
		}
	}

	/**
	 * Returns the badge tone and display label for a user role.
	 *
	 * Called by: Template ($derived via {@const badge = roleBadge(user.role)} inside the user list)
	 * Purpose: Centralises the role-to-colour mapping so the user-list card renders consistent
	 *          visual badges without repeating inline style logic for each row.
	 *
	 * @param role - The user's role string (e.g. "admin" or "operator")
	 * @returns An object with the badge tone and display label
	 */
	function roleBadge(role: string) {
		return role === 'admin'
			? { tone: 'accent' as const, text: 'Admin' }
			: { tone: 'info' as const, text: 'Operator' };
	}

	/**
	 * Closes the confirmation modal when the Escape key is pressed anywhere on the page.
	 *
	 * Called by: svelte:window onkeydown (global keyboard event listener)
	 * Purpose: Provides a standard keyboard escape hatch for the modal so the admin can
	 *          dismiss it without reaching for the mouse, improving accessibility.
	 *
	 * @param e - The native KeyboardEvent fired by the window
	 * @returns void
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && confirmOpen) closeConfirm();
	}
</script>

<Panel title="Benutzer">
	{#if loading}
		<div class="h-24 animate-pulse rounded-sm bg-sunk"></div>
	{:else if users.length === 0}
		<p class="text-[13px] text-faint">Keine Benutzer vorhanden.</p>
	{:else}
		<ul class="-mx-4 -my-4 divide-y divide-line">
			{#each users as user (user.id)}
				{@const badge = roleBadge(user.role)}
				<li class="flex items-center gap-3 px-4 py-2.5">
					<span
						class="num inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong bg-sunk text-xs"
						aria-hidden="true">{(user.name || user.email).charAt(0).toUpperCase()}</span
					>
					<span class="flex min-w-0 flex-1 flex-col">
						<span class="truncate text-sm font-medium">{user.name || '—'}</span>
						<span class="truncate text-xs text-muted">{user.email}</span>
					</span>
					<Badge tone={badge.tone}>{badge.text}</Badge>
					<span class="num hidden text-xs text-faint sm:block">{formatDateTime(user.created_at)}</span>
					<Button variant="ghost" size="icon-sm" class="hover:text-danger" onclick={() => requestDeleteUser(user)} aria-label="Benutzer löschen" title="Löschen">
						<Trash2 size={14} />
					</Button>
				</li>
			{/each}
		</ul>
	{/if}
</Panel>

<Panel title="Neuen Benutzer anlegen">
	<form class="grid gap-3 sm:grid-cols-2" onsubmit={handleCreate}>
		<Field label="Name" for="new-name"><Input id="new-name" bind:value={newName} placeholder="Max Mustermann" required /></Field>
		<Field label="E-Mail" for="new-email"><Input id="new-email" type="email" bind:value={newEmail} placeholder="max@firma.de" required /></Field>
		<Field label="Passwort" for="new-password">
			<Input id="new-password" type="password" bind:value={newPassword} placeholder="Mindestens 8 Zeichen" minlength={8} required />
		</Field>
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-medium text-muted">Rolle</span>
			<Segmented
				label="Rolle"
				options={[
					{ value: 'admin', label: 'Admin', icon: Shield },
					{ value: 'operator', label: 'Operator' }
				]}
				bind:value={newRole}
				class="self-start"
			/>
		</div>
		<Button type="submit" variant="solid" class="self-start" disabled={creating}>
			{#if creating}Wird erstellt …{:else}<UserPlus size={15} /> Benutzer erstellen{/if}
		</Button>
	</form>
</Panel>

<ConfirmationDialog
	open={confirmOpen}
	title={confirmTitle}
	message={confirmMessage}
	confirmLabel={confirmLoading ? 'Wird gelöscht …' : 'Unwiderruflich löschen'}
	loading={confirmLoading}
	onConfirm={executeConfirm}
	onCancel={closeConfirm}
/>
