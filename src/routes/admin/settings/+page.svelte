<script lang="ts">
	import { apiGet, apiPost, formatDateTime } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { UserPlus, Shield, Trash2, KeyRound, TriangleAlert, X } from 'lucide-svelte';

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

	// Change password
	let currentPw = $state('');
	let changePw = $state('');
	let confirmPw = $state('');
	let changingPassword = $state(false);

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
	 * Returns the background colour, text colour, and display label for a user role badge.
	 *
	 * Called by: Template ($derived via {@const badge = roleBadge(user.role)} inside the user list)
	 * Purpose: Centralises the role-to-colour mapping so the user-list card renders consistent
	 *          visual badges without repeating inline style logic for each row.
	 *
	 * @param role - The user's role string (e.g. "admin" or "operator")
	 * @returns An object with bg (background hex), color (text hex), and text (display label)
	 */
	function roleBadge(role: string) {
		return role === 'admin'
			? { bg: '#ede9fe', color: '#7c3aed', text: 'Admin' }
			: { bg: '#dbeafe', color: '#2563eb', text: 'Operator' };
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

<svelte:window onkeydown={handleKeydown} />

<div class="settings-page">
	<div class="page-header">
		<h1>Einstellungen</h1>
	</div>

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

	<!-- Create User Card -->
	<div class="card">
		<div class="card-header">
			<UserPlus size={20} />
			<h2>Neuen Benutzer anlegen</h2>
		</div>

		<form class="create-form" onsubmit={handleCreate}>
			<div class="form-row">
				<div class="field">
					<label for="new-name">Name</label>
					<input
						id="new-name"
						type="text"
						bind:value={newName}
						placeholder="Max Mustermann"
						required
					/>
				</div>
				<div class="field">
					<label for="new-email">E-Mail</label>
					<input
						id="new-email"
						type="email"
						bind:value={newEmail}
						placeholder="max@aust-umzuege.de"
						required
					/>
				</div>
			</div>

			<div class="form-row">
				<div class="field">
					<label for="new-password">Passwort</label>
					<input
						id="new-password"
						type="password"
						bind:value={newPassword}
						placeholder="Mindestens 8 Zeichen"
						minlength={8}
						required
					/>
				</div>
				<div class="field">
					<label for="new-role">Rolle</label>
					<div class="role-toggle">
						<button
							type="button"
							class:active={newRole === 'admin'}
							onclick={() => (newRole = 'admin')}
						>
							<Shield size={14} />
							Admin
						</button>
						<button
							type="button"
							class:active={newRole === 'operator'}
							onclick={() => (newRole = 'operator')}
						>
							Operator
						</button>
					</div>
				</div>
			</div>

			<button type="submit" class="btn-create" disabled={creating}>
				{#if creating}
					Wird erstellt...
				{:else}
					<UserPlus size={16} />
					Benutzer erstellen
				{/if}
			</button>
		</form>
	</div>

	<!-- Users List Card -->
	<div class="card">
		<div class="card-header">
			<Shield size={20} />
			<h2>Benutzer</h2>
		</div>

		{#if loading}
			<div class="loading">Lade Benutzer...</div>
		{:else if users.length === 0}
			<div class="empty">Keine Benutzer vorhanden.</div>
		{:else}
			<div class="users-list">
				{#each users as user (user.id)}
					{@const badge = roleBadge(user.role)}
					<div class="user-row">
						<div class="user-info">
							<div class="user-avatar">
								{(user.name || user.email).charAt(0).toUpperCase()}
							</div>
							<div class="user-details">
								<span class="user-name">{user.name || '—'}</span>
								<span class="user-email">{user.email}</span>
							</div>
						</div>
						<div class="user-meta">
							<span class="role-badge" style="background: {badge.bg}; color: {badge.color};">
								{badge.text}
							</span>
							<span class="user-date">{formatDateTime(user.created_at)}</span>
							<button
								class="btn-delete"
								onclick={() => requestDeleteUser(user)}
								aria-label="Benutzer loeschen"
								title="Loeschen"
							>
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

</div>

<!-- Confirm Modal -->
{#if confirmOpen}
	<div class="modal-backdrop" role="dialog" tabindex="-1" onclick={(e) => { if (e.target === e.currentTarget) closeConfirm(); }} onkeydown={(e) => { if (e.key === 'Escape') closeConfirm(); }}>
		<div class="modal">
			<button class="modal-close" onclick={closeConfirm} aria-label="Schliessen">
				<X size={18} />
			</button>
			<div class="modal-icon">
				<TriangleAlert size={28} />
			</div>
			<h3 class="modal-title">{confirmTitle}</h3>
			<p class="modal-message">{confirmMessage}</p>
			<div class="modal-actions">
				<button class="btn-cancel" onclick={closeConfirm}>Abbrechen</button>
				<button class="btn-confirm-danger" onclick={executeConfirm} disabled={confirmLoading}>
					{confirmLoading ? 'Wird geloescht...' : 'Unwiderruflich loeschen'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.settings-page {
		max-width: 800px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.page-header h1 {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--dt-on-surface);
	}

	.card {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: 1.5rem;
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

	/* Form */
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

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.field label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
	}

	.field input {
		padding: 0.625rem 0.75rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-md);
		color: var(--dt-on-surface);
		font-size: 0.9375rem;
		outline: none;
		transition: background var(--dt-transition), border-color var(--dt-transition);
	}

	.field input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom-color: var(--dt-primary);
	}

	.field input::placeholder {
		color: var(--dt-outline-variant);
	}

	.role-toggle {
		display: flex;
		border-radius: var(--dt-radius-md);
		overflow: hidden;
		background: var(--dt-surface-container-high);
	}

	.role-toggle button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.625rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all var(--dt-transition);
	}

	.role-toggle button.active {
		background: var(--dt-primary-container);
		color: var(--dt-on-primary);
	}

	.btn-create {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem var(--dt-space-6);
		background: linear-gradient(135deg, #022448, #1e3a5f);
		color: var(--dt-on-primary);
		font-weight: 600;
		font-size: 0.9375rem;
		border: none;
		border-radius: var(--dt-radius-md);
		cursor: pointer;
		transition: opacity var(--dt-transition);
		align-self: flex-start;
	}

	.btn-create:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-create:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Users list */
	.loading,
	.empty {
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		padding: 1rem 0;
	}

	.users-list {
		display: flex;
		flex-direction: column;
	}

	.user-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 0;
	}

	.user-row:nth-child(even) {
		background: var(--dt-surface-container-low);
		margin: 0 -1.5rem;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar {
		width: 36px;
		height: 36px;
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.875rem;
		color: var(--dt-primary);
	}

	.user-details {
		display: flex;
		flex-direction: column;
	}

	.user-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--dt-on-surface);
	}

	.user-email {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.user-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.role-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.5rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.user-date {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.btn-delete {
		display: flex;
		align-items: center;
		padding: 0.375rem;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface-variant);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all var(--dt-transition);
	}

	.btn-delete:hover {
		color: var(--dt-secondary);
		background: rgba(168, 57, 0, 0.08);
	}

	/* Confirm Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(2, 36, 72, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 150ms ease;
	}

	.modal {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		box-shadow: var(--dt-shadow-ambient);
		padding: 2rem;
		max-width: 420px;
		width: 90vw;
		position: relative;
		text-align: center;
	}

	.modal-close {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		color: var(--dt-on-surface-variant);
		padding: 0.25rem;
		border-radius: var(--dt-radius-sm);
		display: flex;
		background: transparent;
		border: var(--dt-ghost-border);
		cursor: pointer;
		transition: all var(--dt-transition);
	}

	.modal-close:hover {
		color: var(--dt-on-surface);
		background: var(--dt-surface-container);
	}

	.modal-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--dt-radius-md);
		background: rgba(168, 57, 0, 0.08);
		color: var(--dt-secondary);
		margin-bottom: 1rem;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--dt-on-surface);
		margin-bottom: 0.5rem;
	}

	.modal-message {
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
		line-height: 1.5;
		margin-bottom: 1.5rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.btn-cancel {
		padding: 0.625rem 1.25rem;
		background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface);
		font-weight: 600;
		font-size: 0.875rem;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-md);
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.btn-cancel:hover {
		background: var(--dt-surface-container);
	}

	.btn-confirm-danger {
		padding: 0.625rem 1.25rem;
		background: linear-gradient(135deg, #a83900, #8a2e00);
		color: #ffffff;
		font-weight: 600;
		font-size: 0.875rem;
		border: none;
		border-radius: var(--dt-radius-md);
		cursor: pointer;
		transition: opacity var(--dt-transition);
	}

	.btn-confirm-danger:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-confirm-danger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (max-width: 600px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.user-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.user-meta {
			padding-left: 2.75rem;
		}

	}
</style>
