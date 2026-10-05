<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Building2, Copy, Plus } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	/**
	 * Firmen — the companies (tenants) of this installation. Platform superusers only
	 * (`users.is_superuser`, set from the server's command line); the API re-checks
	 * every call. Creating a company also creates its first admin and shows that
	 * admin's one-time password once.
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
	let name = $state('');
	let slug = $state('');
	let adminEmail = $state('');
	let saving = $state(false);
	let created = $state<Created | null>(null);

	/** Kürzel from the name until the user edits it: lowercase, a–z/0–9/-. */
	let slugTouched = $state(false);
	$effect(() => {
		if (slugTouched) return;
		slug = name
			.toLowerCase()
			.replace(/ä/g, 'ae')
			.replace(/ö/g, 'oe')
			.replace(/ü/g, 'ue')
			.replace(/ß/g, 'ss')
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

	async function create(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		try {
			created = await apiPost<Created>('/api/v1/platform/tenants', {
				name,
				slug,
				admin_email: adminEmail
			});
			name = '';
			adminEmail = '';
			slugTouched = false;
			await load();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Firma konnte nicht angelegt werden', 'error');
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

<PageHeader title="Firmen" count="{tenants.length} Mandanten" />

<div class="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_360px]">
	<div class="min-w-0">
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
						<tr>
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
		{/if}
	</div>

	<Card class="p-4">
		<h2 class="mb-3 flex items-center gap-2 text-[15px] font-semibold"><Building2 size={16} /> Neue Firma</h2>
		<form class="flex flex-col gap-3" onsubmit={create}>
			<Field label="Firmenname" for="t-name">
				<Input id="t-name" bind:value={name} required placeholder="Muster Umzüge GmbH" />
			</Field>
			<Field label="Kürzel" for="t-slug" hint="Nur a–z, 0–9 und -. Steht in der Konfiguration ([tenants.kürzel]).">
				<Input id="t-slug" bind:value={slug} required oninput={() => (slugTouched = true)} />
			</Field>
			<Field label="E-Mail des ersten Admins" for="t-admin">
				<Input id="t-admin" type="email" bind:value={adminEmail} required />
			</Field>
			<Button type="submit" variant="accent" disabled={saving || !name || !slug || !adminEmail}>
				<Plus size={16} /> Firma anlegen
			</Button>
		</form>

		{#if created}
			<Notice tone="warn" class="mt-4">
				<div class="flex flex-col gap-1.5">
					<span><strong>{created.slug}</strong> angelegt. Einmal-Passwort für {created.admin_email} — wird nur jetzt angezeigt:</span>
					<span class="flex items-center gap-2">
						<code class="num rounded-sm bg-sunk px-2 py-1 text-[13px]">{created.admin_password}</code>
						<Button size="icon-sm" variant="ghost" aria-label="Passwort kopieren" onclick={copyPassword}><Copy size={14} /></Button>
					</span>
					<span class="text-xs text-muted">
						Anmelden kann sich der Admin sofort. Postfach, Telegram, Domains und Vorlagen brauchen Konfiguration und
						einen Neustart des Backends.
					</span>
				</div>
			</Notice>
		{/if}
	</Card>
</div>
