<script lang="ts">
	import { apiGet, apiPost, apiPut, formatDateTime } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { UserPlus, Shield, Trash2, KeyRound, TriangleAlert, X, Euro, Hash } from 'lucide-svelte';

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

	// --- Settings: pricing + number sequences ---
	interface PricingSettings {
		rate_per_person_hour_cents: number;
		saturday_surcharge_cents: number;
		fahrt_rate_per_km: number;
		assembly_price: number;
		parking_ban_price: number;
		packing_price: number;
		transporter_price: number;
	}
	interface SettingsResponse {
		pricing: PricingSettings;
		next_invoice_number: number;
		next_offer_number: number;
	}

	let settingsLoading = $state(true);
	// Pricing form (euros for display; *_cents fields converted on save/load).
	let laborRateEur = $state(0);
	let saturdaySurchargeEur = $state(0);
	let fahrtRatePerKm = $state(0);
	let assemblyPrice = $state(0);
	let parkingBanPrice = $state(0);
	let packingPrice = $state(0);
	let transporterPrice = $state(0);
	let savingPricing = $state(false);

	let nextInvoiceNumber = $state(0);
	let nextOfferNumber = $state(0);
	let savingNumbers = $state(false);

	$effect(() => {
		loadUsers();
		loadSettings();
	});

	/**
	 * Loads pricing values and the next invoice/KVA numbers from the API.
	 *
	 * Called by: $effect (on mount), savePricing/saveNumbers after a successful write.
	 * Purpose: Populates the Preise and Nummernkreise cards via GET /api/v1/admin/settings.
	 */
	async function loadSettings() {
		settingsLoading = true;
		try {
			const data = await apiGet<SettingsResponse>('/api/v1/admin/settings');
			laborRateEur = data.pricing.rate_per_person_hour_cents / 100;
			saturdaySurchargeEur = data.pricing.saturday_surcharge_cents / 100;
			fahrtRatePerKm = data.pricing.fahrt_rate_per_km;
			assemblyPrice = data.pricing.assembly_price;
			parkingBanPrice = data.pricing.parking_ban_price;
			packingPrice = data.pricing.packing_price;
			transporterPrice = data.pricing.transporter_price;
			nextInvoiceNumber = data.next_invoice_number;
			nextOfferNumber = data.next_offer_number;
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Laden der Einstellungen', 'error');
		} finally {
			settingsLoading = false;
		}
	}

	/**
	 * Persists the standard pricing values via PUT /api/v1/admin/settings/pricing.
	 *
	 * Called by: Template (Preise form onsubmit).
	 * Purpose: Lets the admin change pricing without a code redeploy. Euro inputs for the
	 *          labor rate and Saturday surcharge are converted back to cents.
	 */
	async function savePricing(e: Event) {
		e.preventDefault();
		savingPricing = true;
		try {
			await apiPut('/api/v1/admin/settings/pricing', {
				rate_per_person_hour_cents: Math.round(laborRateEur * 100),
				saturday_surcharge_cents: Math.round(saturdaySurchargeEur * 100),
				fahrt_rate_per_km: fahrtRatePerKm,
				assembly_price: assemblyPrice,
				parking_ban_price: parkingBanPrice,
				packing_price: packingPrice,
				transporter_price: transporterPrice
			});
			showToast('Preise gespeichert', 'success');
			await loadSettings();
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Speichern', 'error');
		} finally {
			savingPricing = false;
		}
	}

	/**
	 * Sets the next Rechnungsnummer and KVA-Nummer via PUT /api/v1/admin/settings/numbers.
	 *
	 * Called by: Template (Nummernkreise form onsubmit).
	 * Purpose: Lets the admin reset where the invoice/offer sequences continue from.
	 */
	async function saveNumbers(e: Event) {
		e.preventDefault();
		savingNumbers = true;
		try {
			await apiPut('/api/v1/admin/settings/numbers', {
				next_invoice_number: nextInvoiceNumber,
				next_offer_number: nextOfferNumber
			});
			showToast('Nummernkreise gespeichert', 'success');
			await loadSettings();
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Speichern', 'error');
		} finally {
			savingNumbers = false;
		}
	}

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

	<!-- Pricing Card -->
	<div class="card">
		<div class="card-header">
			<Euro size={20} />
			<h2>Preise</h2>
		</div>

		{#if settingsLoading}
			<div class="loading">Lade Einstellungen...</div>
		{:else}
			<form class="create-form" onsubmit={savePricing}>
				<div class="form-row">
					<div class="field">
						<label for="labor-rate">Stundensatz pro Helfer (EUR, netto)</label>
						<input id="labor-rate" type="number" step="0.01" min="0" bind:value={laborRateEur} required />
					</div>
					<div class="field">
						<label for="saturday">Samstagszuschlag (EUR)</label>
						<input id="saturday" type="number" step="0.01" min="0" bind:value={saturdaySurchargeEur} required />
					</div>
				</div>
				<div class="form-row">
					<div class="field">
						<label for="fahrt">Fahrkosten pro km (EUR)</label>
						<input id="fahrt" type="number" step="0.01" min="0" bind:value={fahrtRatePerKm} required />
					</div>
					<div class="field">
						<label for="assembly">De-/Montage pro Einheit (EUR)</label>
						<input id="assembly" type="number" step="0.01" min="0" bind:value={assemblyPrice} required />
					</div>
				</div>
				<div class="form-row">
					<div class="field">
						<label for="parking">Halteverbotszone pro Stück (EUR)</label>
						<input id="parking" type="number" step="0.01" min="0" bind:value={parkingBanPrice} required />
					</div>
					<div class="field">
						<label for="packing">Umzugsmaterial (EUR)</label>
						<input id="packing" type="number" step="0.01" min="0" bind:value={packingPrice} required />
					</div>
				</div>
				<div class="form-row">
					<div class="field">
						<label for="transporter">3,5t Transporter (EUR)</label>
						<input id="transporter" type="number" step="0.01" min="0" bind:value={transporterPrice} required />
					</div>
					<div class="field"></div>
				</div>
				<button type="submit" class="btn-create" disabled={savingPricing}>
					{#if savingPricing}
						Wird gespeichert...
					{:else}
						<Euro size={16} />
						Preise speichern
					{/if}
				</button>
			</form>
		{/if}
	</div>

	<!-- Number Sequences Card -->
	<div class="card">
		<div class="card-header">
			<Hash size={20} />
			<h2>Nummernkreise</h2>
		</div>

		{#if settingsLoading}
			<div class="loading">Lade Einstellungen...</div>
		{:else}
			<form class="create-form" onsubmit={saveNumbers}>
				<div class="form-row">
					<div class="field">
						<label for="next-invoice">Nächste Rechnungsnummer</label>
						<input id="next-invoice" type="number" step="1" min="1" bind:value={nextInvoiceNumber} required />
					</div>
					<div class="field">
						<label for="next-offer">Nächste KVA-Nummer</label>
						<input id="next-offer" type="number" step="1" min="1" bind:value={nextOfferNumber} required />
					</div>
				</div>
				<p class="hint">
					Legt fest, mit welcher Nummer die nächste Rechnung bzw. der nächste
					Kostenvoranschlag erzeugt wird. Danach wird automatisch hochgezählt.
				</p>
				<button type="submit" class="btn-create" disabled={savingNumbers}>
					{#if savingNumbers}
						Wird gespeichert...
					{:else}
						<Hash size={16} />
						Nummernkreise speichern
					{/if}
				</button>
			</form>
		{/if}
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

	.field input {
		padding: 0.625rem 0.75rem;
		font-size: 0.9375rem;
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
		padding: 0.75rem var(--dt-space-6);
		font-size: 0.9375rem;
		align-self: flex-start;
		justify-content: center;
	}

	.hint {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		line-height: 1.5;
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
		z-index: 9999;
	}

	.modal {
		padding: 2rem;
		max-width: 420px;
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
		justify-content: center;
	}

	.btn-cancel {
		padding: 0.625rem 1.25rem;
	}

	.btn-confirm-danger {
		padding: 0.625rem 1.25rem;
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
