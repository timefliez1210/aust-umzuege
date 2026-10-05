<script lang="ts" module>
	/** A company's profile as `/platform/tenants/{id}` and `/admin/tenant` speak it. */
	export interface CompanyProfile {
		name: string;
		short_name: string;
		brand_name: string;
		owner_name: string;
		phone: string;
		street: string;
		postal_code: string;
		city: string;
		email: string;
		website: string;
		agb_url: string;
		review_url: string;
		bank_name: string;
		iban: string;
		bic: string;
		tax_number: string;
		vat_id: string;
		depot_address: string;
		accent_color: string;
		soul_md: string | null;
		has_logo: boolean;
	}

	export function emptyProfile(): CompanyProfile {
		return {
			name: '',
			short_name: '',
			brand_name: '',
			owner_name: '',
			phone: '',
			street: '',
			postal_code: '',
			city: '',
			email: '',
			website: '',
			agb_url: '',
			review_url: '',
			bank_name: '',
			iban: '',
			bic: '',
			tax_number: '',
			vat_id: '',
			depot_address: '',
			accent_color: '#ff5a1f',
			soul_md: null,
			has_logo: false
		};
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	/**
	 * Everything a company's offers, invoices and mails print about it. Its document
	 * templates are Aust's layout with exactly these details and the logo swapped in.
	 */
	let {
		profile = $bindable(),
		logo = $bindable(null),
		prefix,
		autofill = false,
		header
	}: {
		profile: CompanyProfile;
		/** A newly chosen logo file, uploaded by the page after saving. */
		logo?: File | null;
		/** Unique id prefix, so two forms on a page don't share label targets. */
		prefix: string;
		/** New company: fill Kurzname/Marke from the full name until edited. */
		autofill?: boolean;
		header?: Snippet;
	} = $props();

	let logoPreview = $derived(logo ? URL.createObjectURL(logo) : null);
	$effect(() => {
		const url = logoPreview;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	});

	// Kurzname and Marke follow the full name until edited.
	let shortTouched = $state(false);
	$effect(() => {
		const name = profile.name;
		if (!autofill || shortTouched) return;
		const short = name.replace(/\s+(GmbH|UG|KG|OHG|AG|e\.K\.|GbR)(\s.*)?$/i, '').trim();
		profile.short_name = short;
		profile.brand_name = short;
	});

	function pickLogo(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0] ?? null;
		logo = file;
	}

	const id = (s: string) => `${prefix}-${s}`;
</script>

<div class="flex flex-col gap-4">
	{@render header?.()}

	<fieldset class="flex flex-col gap-3">
		<legend class="label-xs mb-1 text-faint">Firma</legend>
		<Field label="Firmenname (wie auf Rechnungen)" for={id('name')}>
			<Input id={id('name')} bind:value={profile.name} required placeholder="Muster Umzüge GmbH" />
		</Field>
		<div class="grid gap-3 sm:grid-cols-2">
			<Field label="Kurzname" for={id('short')} hint="Login-Mails, Signaturen, Konsole">
				<Input id={id('short')} bind:value={profile.short_name} required oninput={() => (shortTouched = true)} />
			</Field>
			<Field label="Inhaber/in" for={id('owner')}>
				<Input id={id('owner')} bind:value={profile.owner_name} />
			</Field>
		</div>
	</fieldset>

	<fieldset class="flex flex-col gap-3">
		<legend class="label-xs mb-1 text-faint">Logo &amp; Farbe</legend>
		<div class="flex items-center gap-3">
			<div class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line bg-sunk">
				{#if logoPreview}
					<img src={logoPreview} alt="Neues Logo" class="max-h-full max-w-full object-contain" />
				{:else if profile.has_logo}
					<span class="text-center text-[11px] text-muted">Logo hinterlegt</span>
				{:else}
					<span class="text-center text-[11px] text-faint">kein Logo</span>
				{/if}
			</div>
			<div class="flex min-w-0 flex-col gap-1">
				<input
					id={id('logo')}
					type="file"
					accept="image/png,image/jpeg,image/webp"
					onchange={pickLogo}
					class="text-xs file:mr-2 file:rounded-sm file:border file:border-line file:bg-panel file:px-2 file:py-1 file:text-xs"
				/>
				<span class="text-xs text-faint">PNG, JPEG oder WebP, bis 2 MB — wird in die Logo-Fläche der Vorlagen eingepasst.</span>
			</div>
		</div>
		<Field label="Akzentfarbe der Konsole" for={id('accent')}>
			<div class="flex items-center gap-2">
				<input id={id('accent')} type="color" bind:value={profile.accent_color} class="h-9 w-12 rounded-sm border border-line bg-panel" />
				<span class="num text-xs text-muted">{profile.accent_color}</span>
			</div>
		</Field>
	</fieldset>

	<fieldset class="flex flex-col gap-3">
		<legend class="label-xs mb-1 text-faint">Anschrift</legend>
		<Field label="Straße und Hausnummer" for={id('street')}>
			<Input id={id('street')} bind:value={profile.street} />
		</Field>
		<div class="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
			<Field label="PLZ" for={id('zip')}><Input id={id('zip')} bind:value={profile.postal_code} /></Field>
			<Field label="Ort" for={id('city')}><Input id={id('city')} bind:value={profile.city} /></Field>
		</div>
		<Field label="Depot (Start und Ziel jeder Route)" for={id('depot')} hint="Für Fahrkostenpauschale und Karte">
			<Input id={id('depot')} bind:value={profile.depot_address} placeholder="Straße Nr PLZ Ort" />
		</Field>
	</fieldset>

	<fieldset class="flex flex-col gap-3">
		<legend class="label-xs mb-1 text-faint">Kontakt</legend>
		<div class="grid gap-3 sm:grid-cols-2">
			<Field label="Telefon" for={id('phone')}><Input id={id('phone')} bind:value={profile.phone} /></Field>
			<Field label="E-Mail" for={id('email')}><Input id={id('email')} type="email" bind:value={profile.email} /></Field>
			<Field label="Website" for={id('web')}><Input id={id('web')} bind:value={profile.website} placeholder="www.…" /></Field>
			<Field label="AGB-Link" for={id('agb')}><Input id={id('agb')} bind:value={profile.agb_url} /></Field>
		</div>
		<Field label="Link für Google-Bewertungen" for={id('review')}>
			<Input id={id('review')} bind:value={profile.review_url} />
		</Field>
	</fieldset>

	<fieldset class="flex flex-col gap-3">
		<legend class="label-xs mb-1 text-faint">Bank &amp; Steuer (Fußzeile)</legend>
		<Field label="Bank" for={id('bank')}><Input id={id('bank')} bind:value={profile.bank_name} /></Field>
		<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
			<Field label="IBAN" for={id('iban')}><Input id={id('iban')} bind:value={profile.iban} class="num" /></Field>
			<Field label="BIC" for={id('bic')}><Input id={id('bic')} bind:value={profile.bic} class="num" /></Field>
		</div>
		<div class="grid gap-3 sm:grid-cols-2">
			<Field label="Steuernummer" for={id('tax')}><Input id={id('tax')} bind:value={profile.tax_number} class="num" /></Field>
			<Field label="USt-IdNr." for={id('vat')}><Input id={id('vat')} bind:value={profile.vat_id} class="num" /></Field>
		</div>
	</fieldset>
</div>
