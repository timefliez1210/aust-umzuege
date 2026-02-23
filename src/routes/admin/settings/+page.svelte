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
	function openConfirm(title: string, message: string, action: () => Promise<void>) {
		confirmTitle = title;
		confirmMessage = message;
		confirmAction = action;
		confirmLoading = false;
		confirmOpen = true;
	}

	function closeConfirm() {
		confirmOpen = false;
		confirmAction = null;
	}

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

	function roleBadge(role: string) {
		return role === 'admin'
			? { bg: '#ede9fe', color: '#7c3aed', text: 'Admin' }
			: { bg: '#dbeafe', color: '#2563eb', text: 'Operator' };
	}

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
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeConfirm}>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="modal" onclick={(e) => e.stopPropagation()}>
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
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.card {
		background: #ffffff;
		border-radius: 16px;
		box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff;
		padding: 1.5rem;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
		color: #1a1a2e;
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
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.field input {
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

	.field input:focus {
		box-shadow: inset 2px 2px 5px #c5cdd8, inset -2px -2px 5px #ffffff,
			0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.field input::placeholder {
		color: #94a3b8;
	}

	.role-toggle {
		display: flex;
		border-radius: 10px;
		overflow: hidden;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
		background: #e8ecf1;
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
		color: #94a3b8;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.role-toggle button.active {
		background: #6366f1;
		color: #ffffff;
		box-shadow: 2px 2px 6px rgba(99, 102, 241, 0.3);
	}

	.btn-create {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: #6366f1;
		color: #ffffff;
		font-weight: 600;
		font-size: 0.9375rem;
		border: none;
		border-radius: 10px;
		box-shadow: 3px 3px 10px rgba(99, 102, 241, 0.3);
		cursor: pointer;
		transition: background 150ms ease;
		align-self: flex-start;
	}

	.btn-create:hover:not(:disabled) {
		background: #4f46e5;
	}

	.btn-create:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Users list */
	.loading,
	.empty {
		color: #94a3b8;
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
		border-bottom: 1px solid #f1f5f9;
	}

	.user-row:last-child {
		border-bottom: none;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: #e8ecf1;
		box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.875rem;
		color: #6366f1;
	}

	.user-details {
		display: flex;
		flex-direction: column;
	}

	.user-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: #1a1a2e;
	}

	.user-email {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.user-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.role-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.user-date {
		font-size: 0.75rem;
		color: #94a3b8;
		white-space: nowrap;
	}

	.btn-delete {
		display: flex;
		align-items: center;
		padding: 0.375rem;
		border-radius: 8px;
		color: #94a3b8;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.btn-delete:hover {
		color: #ef4444;
		background: #fee2e2;
	}

	/* Confirm Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 150ms ease;
	}

	.modal {
		background: #ffffff;
		border-radius: 16px;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
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
		color: #94a3b8;
		padding: 0.25rem;
		border-radius: 8px;
		display: flex;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.modal-close:hover {
		color: #1a1a2e;
		background: #f1f5f9;
	}

	.modal-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background: #fef2f2;
		color: #dc2626;
		margin-bottom: 1rem;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: #1a1a2e;
		margin-bottom: 0.5rem;
	}

	.modal-message {
		font-size: 0.875rem;
		color: #64748b;
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
		background: #e8ecf1;
		color: #475569;
		font-weight: 600;
		font-size: 0.875rem;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.btn-cancel:hover {
		background: #dde3ea;
	}

	.btn-confirm-danger {
		padding: 0.625rem 1.25rem;
		background: #dc2626;
		color: #ffffff;
		font-weight: 600;
		font-size: 0.875rem;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.btn-confirm-danger:hover:not(:disabled) {
		background: #b91c1c;
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

		.danger-row {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
