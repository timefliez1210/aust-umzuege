<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { apiGet, apiPost, apiPut, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Building2, Copy, Plus, X } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import CompanyForm, { emptyProfile, type CompanyProfile } from './_components/CompanyForm.svelte';

	/**
	 * Firmen — the companies (tenants) of this installation. Platform superusers only
	 * (`users.is_superuser`, set from the server's command line); the API re-checks
	 * every call. A company's details and logo go straight into its own offers,
	 * invoices and forms (Aust's layout with them swapped in).
	 */
	interface TenantRow {
		id: string;
		slug: string;
		name: string;
		domains: string[];
		created_at: string;
		users: number;
		customers: number;
		inquiries: number;
	}
	interface Created {
		id: string;
		slug: string;
		admin_email: string;
		admin_password: string;
	}

	$effect(() => {
		if (auth.user && !auth.user.superuser) goto('/admin');
	});

	let tenants = $state<TenantRow[]>([]);
	let loading = $state(true);

	/** `null` = the "Neue Firma" form; otherwise the company being edited. */
	let editing = $state<TenantRow | null>(null);
	let profile = $state<CompanyProfile>(emptyProfile());
	let logo = $state<File | null>(null);
	let slug = $state('');
	let slugTouched = $state(false);
	let adminEmail = $state('');
	let saving = $state(false);
	let created = $state<Created | null>(null);

	// Kürzel from the name until edited: lowercase, a–z/0–9/-.
	$effect(() => {
		const name = profile.name;
		if (editing || slugTouched) return;
		slug = name
			.toLowerCase()
			.replace(/ä/g, 'ae')
			.replace(/ö/g, 'oe')
			.replace(/ü/g, 'ue')
			.replace(/ß/g, 'ss')
			.replace(/\s+(gmbh|ug|kg|ohg|ag|gbr)\b.*$/, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 40);
	});

	$effect(() => {
		untrack(load);
	});

	async function load() {
		loading = true;
		try {
			tenants = await apiGet<TenantRow[]>('/api/v1/platform/tenants');
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Firmen konnten nicht geladen werden', 'error');
		} finally {
			loading = false;
		}
	}

	function startNew() {
		editing = null;
		profile = emptyProfile();
		logo = null;
		slug = '';
		slugTouched = false;
		adminEmail = '';
	}

	async function startEdit(t: TenantRow) {
		created = null;
		try {
			profile = await apiGet<CompanyProfile>(`/api/v1/platform/tenants/${t.id}`);
			editing = t;
			logo = null;
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Firma konnte nicht geladen werden', 'error');
		}
	}

	async function uploadLogo(id: string) {
		if (!logo) return;
		await apiPut(`/api/v1/platform/tenants/${id}/logo`, logo);
		logo = null;
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		try {
			if (editing) {
				const newLogo = !!logo;
				profile = await apiPut<CompanyProfile>(`/api/v1/platform/tenants/${editing.id}`, profile);
				await uploadLogo(editing.id);
				profile.has_logo = profile.has_logo || newLogo;
				showToast('Firma gespeichert — Vorlagen sind aktualisiert', 'success');
			} else {
				const result = await apiPost<Created>('/api/v1/platform/tenants', {
					...profile,
					slug,
					admin_email: adminEmail
				});
				await uploadLogo(result.id);
				created = result;
				startNew();
			}
			await load();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Speichern fehlgeschlagen', 'error');
		} finally {
			saving = false;
		}
	}

	async function copyPassword() {
		if (!created) return;
		try {
			await navigator.clipboard.writeText(created.admin_password);
			showToast('Passwort kopiert', 'success');
		} catch {
			showToast('Kopieren nicht möglich — bitte abschreiben', 'error');
		}
	}
</script>

<svelte:head><title>Firmen</title></svelte:head>

<PageHeader title="Firmen" count="{tenants.length} Mandanten">
	{#snippet actions()}
		{#if editing}
			<Button variant="accent" onclick={startNew}><Plus size={16} /> Neue Firma</Button>
		{/if}
	{/snippet}
</PageHeader>

<div class="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_440px]">
	<div class="flex min-w-0 flex-col gap-3.5">
		{#if created}
			<Notice tone="warn">
				<div class="flex flex-col gap-1.5">
					<span><strong>{created.slug}</strong> angelegt. Einmal-Passwort für {created.admin_email} — wird nur jetzt angezeigt:</span>
					<span class="flex items-center gap-2">
						<code class="num rounded-sm bg-sunk px-2 py-1 text-[13px]">{created.admin_password}</code>
						<Button size="icon-sm" variant="ghost" aria-label="Passwort kopieren" onclick={copyPassword}><Copy size={14} /></Button>
					</span>
					<span class="text-xs text-muted">
						Der Admin kann sich sofort anmelden; Angebote und Rechnungen tragen schon Name, Anschrift, Bank und Logo
						der Firma. Postfach, Telegram und Domains brauchen Konfiguration und einen Neustart.
					</span>
				</div>
			</Notice>
		{/if}

		{#if loading}
			<div class="h-48 animate-pulse rounded-md bg-sunk"></div>
		{:else if tenants.length === 0}
			<EmptyState title="Keine Firmen" hint="Die erste Firma legt die Installation selbst an." />
		{:else}
			<Table minWidth="640px">
				<thead>
					<tr>
						<th>Firma</th>
						<th>Kürzel</th>
						<th>Domains</th>
						<th class="text-right">Benutzer</th>
						<th class="text-right">Kunden</th>
						<th class="text-right">Anfragen</th>
						<th>Angelegt</th>
					</tr>
				</thead>
				<tbody>
					{#each tenants as t (t.id)}
						<tr
							class="cursor-pointer hover:bg-sunk/60 {editing?.id === t.id ? 'bg-sunk shadow-[inset_2px_0_0_var(--accent)]' : ''}"
							onclick={() => startEdit(t)}
						>
							<td class="font-medium">{t.name}</td>
							<td class="num text-muted">{t.slug}</td>
							<td class="text-muted">{t.domains.join(', ') || '—'}</td>
							<td class="num text-right">{t.users}</td>
							<td class="num text-right">{t.customers}</td>
							<td class="num text-right">{t.inquiries}</td>
							<td class="num text-muted">{formatDate(t.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</Table>
			<p class="text-xs text-faint">Zeile anklicken, um Firmendaten und Logo zu bearbeiten.</p>
		{/if}
	</div>

	<Card class="p-4">
		<form class="flex flex-col gap-4" onsubmit={save}>
			<header class="flex items-center justify-between gap-2">
				<h2 class="flex items-center gap-2 text-[15px] font-semibold">
					<Building2 size={16} />
					{editing ? editing.name : 'Neue Firma'}
				</h2>
				{#if editing}
					<Button size="icon-sm" variant="ghost" aria-label="Schließen" onclick={startNew}><X size={16} /></Button>
				{/if}
			</header>

			{#if !editing}
				<div class="grid gap-3 sm:grid-cols-2">
					<Field label="Kürzel" for="new-slug" hint="a–z, 0–9, - · für [tenants.kürzel]">
						<Input id="new-slug" bind:value={slug} required oninput={() => (slugTouched = true)} />
					</Field>
					<Field label="E-Mail des ersten Admins" for="new-admin">
						<Input id="new-admin" type="email" bind:value={adminEmail} required />
					</Field>
				</div>
			{/if}

			{#key editing?.id ?? 'new'}
				<CompanyForm bind:profile bind:logo prefix={editing ? `edit-${editing.id}` : 'new'} autofill={!editing} />
			{/key}

			<Button type="submit" variant="accent" disabled={saving || !profile.name || (!editing && (!slug || !adminEmail))}>
				{editing ? 'Speichern' : 'Firma anlegen'}
			</Button>
		</form>
	</Card>
</div>
