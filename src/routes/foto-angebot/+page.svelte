<!--
  foto-angebot — multi-step wizard prototype
  ==========================================
  Steps adapt dynamically to the chosen service:
    1. service  — always
    2. mode     — skipped when service only allows one mode
    3. contact  — always
    4. address  — skipped when service needs no addresses
    5. details  — always (upload/volume + addons + message + submit)

  Transitions: CSS fade+lift via {#key currentStepIndex}.
  Auto-advance on card clicks (service, mode) so the wizard feels instant.
  Wire-up TODOs marked with // TODO: wire up
-->
<script lang="ts">
	import { page } from '$app/stores';
	import {
		Send, Camera, Video, Calendar, ClipboardList,
		Building2, User, Users, ChevronLeft, Check, MapPin,
	} from 'lucide-svelte';
	import MediaDropzone from '$lib/components/MediaDropzone.svelte';
	import MediaPreviewGrid from '$lib/components/MediaPreviewGrid.svelte';
	import VolumeCalculator from '$lib/components/VolumeCalculator.svelte';
	import {
		SERVICES,
		SERVICE_BY_ID,
		type ServiceConfig,
		type SubmissionMode,
		type CustomerTypeMode,
		type CustomField,
	} from './serviceConfig';

	const PHOTO_API_URL = import.meta.env.VITE_PHOTO_API_URL || 'https://api.aufraeumhelden.com/api/v1/submit/photo';
	const VIDEO_API_URL = import.meta.env.VITE_VIDEO_API_URL || 'https://api.aufraeumhelden.com/api/v1/submit/video';
	const PHP_URL = '/send-mail.php';

	// ---------------------------------------------------------------------------
	// Mode cards — full descriptions shown on the 'mode' step
	// ---------------------------------------------------------------------------

	const MODE_META: Record<SubmissionMode, {
		label: string;
		tagline: string;
		icon: typeof Camera;
		description: string;
		perks: string[];
	}> = {
		termin: {
			label: 'Vor-Ort-Termin',
			tagline: 'Wir kommen kostenlos zu Ihnen',
			icon: Calendar,
			description:
				'Unser Umzugsexperte begutachtet Ihre Wohnung persönlich und erstellt ein maßgeschneidertes Angebot — ohne versteckte Kosten. Sie müssen nichts vorbereiten.',
			perks: ['Kostenlos & unverbindlich', 'Persönliche Beratung inklusive', 'Genaueste Preisermittlung'],
		},
		manuell: {
			label: 'Möbelliste ausfüllen',
			tagline: 'Selbst erfassen, schnell fertig',
			icon: ClipboardList,
			description:
				'Geben Sie Ihre Adressen ein und wählen Sie Ihre Möbel aus unserem Katalog. Wir berechnen Volumen und Preis vollautomatisch — kein Messen, kein Schätzen.',
			perks: ['Kein Termin nötig', 'Sofortiger Preisüberblick', 'Fertig in unter 5 Minuten'],
		},
		foto: {
			label: 'Fotos hochladen',
			tagline: 'KI erkennt Ihre Möbel automatisch',
			icon: Camera,
			description:
				'Fotografieren Sie jeden Raum kurz ab (2–3 Bilder reichen). Unsere KI analysiert die Bilder, erkennt Ihre Möbel und schätzt Volumen und Aufwand — ganz ohne Ausmessen.',
			perks: ['Kein Ausmessen nötig', 'KI-gestützte Analyse', '2–3 Fotos pro Raum genügen'],
		},
		video: {
			label: 'Video-Rundgang',
			tagline: 'Präziseste 3D-Analyse',
			icon: Video,
			description:
				'Gehen Sie einmal mit dem Handy durch Ihre Wohnung. Unsere 3D-Rekonstruktion liefert die genaueste Volumenberechnung — ideal für große oder komplexe Umzüge.',
			perks: ['Höchste Präzision', '3D-Raumrekonstruktion', 'Ein Durchgang genügt'],
		},
	};

	const floorOptions = [
		{ value: '',                   label: 'Bitte wählen' },
		{ value: 'Erdgeschoss',        label: 'Erdgeschoss' },
		{ value: 'Hochparterre',       label: 'Hochparterre' },
		{ value: '1. Stock',           label: '1. Stock' },
		{ value: '2. Stock',           label: '2. Stock' },
		{ value: '3. Stock',           label: '3. Stock' },
		{ value: '4. Stock',           label: '4. Stock' },
		{ value: '5. Stock',           label: '5. Stock' },
		{ value: '6. Stock',           label: '6. Stock' },
		{ value: 'Höher als 6. Stock', label: 'Höher als 6. Stock' },
	];

	// ---------------------------------------------------------------------------
	// Service selection  (must be declared before `steps` which references it)
	// URL param: /foto-angebot?service=entruempelung  →  pre-selects + skips step 0
	// ---------------------------------------------------------------------------

	// TODO: wire up — read $page.url.searchParams.get('service') on mount
	let selectedServiceId = $state<string | null>(null);

	const selectedService = $derived<ServiceConfig | null>(
		selectedServiceId ? (SERVICE_BY_ID.get(selectedServiceId) ?? null) : null
	);

	// ---------------------------------------------------------------------------
	// Step management
	// ---------------------------------------------------------------------------

	type StepId = 'service' | 'mode' | 'contact' | 'address' | 'details';

	const STEP_LABELS: Record<StepId, string> = {
		service: 'Leistung',
		mode:    'Angebotsart',
		contact: 'Kontakt',
		address: 'Adresse',
		details: 'Details',
	};

	let currentStepIndex = $state(0);

	// Recompute the active step list whenever the selected service changes.
	// This means the progress dots always reflect the actual flow.
	const steps = $derived.by((): StepId[] => {
		if (!selectedServiceId) return ['service'];
		const svc = SERVICE_BY_ID.get(selectedServiceId);
		if (!svc) return ['service'];
		const s: StepId[] = ['service'];
		if (svc.allowedModes.length > 1) s.push('mode');
		s.push('contact');
		const ac = svc.addressConfig;
		if (ac.showOrigin || ac.showDestination) s.push('address');
		s.push('details');
		return s;
	});

	const currentStep = $derived(steps[currentStepIndex] ?? 'service');
	const canGoBack   = $derived(currentStepIndex > 0);
	const isLastStep  = $derived(currentStepIndex === steps.length - 1);

	function goNext() {
		if (currentStepIndex < steps.length - 1) currentStepIndex++;
	}
	function goBack() {
		if (currentStepIndex > 0) currentStepIndex--;
	}

	/** Click handler for a service card on step 0. */
	function pickService(id: string) {
		selectedServiceId = id;
		// Tiny delay so the card shows its selected state before the step fades out
		setTimeout(goNext, 160);
	}

	// ---------------------------------------------------------------------------
	// Submission mode
	// ---------------------------------------------------------------------------

	let activeMode = $state<SubmissionMode>('termin');

	// Keep activeMode in sync when service changes (might restrict modes)
	$effect(() => {
		const svc = selectedService;
		if (svc && !svc.allowedModes.includes(activeMode)) {
			activeMode = svc.allowedModes[0];
		}
	});

	/** Click handler for a mode card on the 'mode' step. */
	function pickMode(mode: SubmissionMode) {
		activeMode = mode;
		setTimeout(goNext, 160);
	}

	// ---------------------------------------------------------------------------
	// Customer type
	// Auto-set when service implies it; toggle only shown for 'ask' services.
	// ---------------------------------------------------------------------------

	type CustomerType = 'private' | 'business';
	let customerType = $state<CustomerType>('private');

	// When service changes, lock in the implied type (or reset to 'private' for 'ask')
	$effect(() => {
		const mode = selectedService?.customerType;
		if (mode === 'private' || mode === 'business') customerType = mode;
		else customerType = 'private';
	});

	const showCustomerTypeToggle = $derived(selectedService?.customerType === 'ask');

	// ---------------------------------------------------------------------------
	// Booking for self vs. someone else
	// Not shown for business (Ansprechpartner always books for the company).
	//
	// bookingForSelf = true  → contact IS the recipient → no payer fields
	// bookingForSelf = false → contact IS the payer    → collect recipient separately
	// ---------------------------------------------------------------------------

	let bookingForSelf = $state(true);
	$effect(() => { selectedService; bookingForSelf = true; }); // reset on service change

	const showBookingForToggle = $derived(customerType !== 'business');

	// ---------------------------------------------------------------------------
	// Contact fields  (= the person filling the form, always collected)
	// Role depends on bookingForSelf:
	//   true  → recipient (saved to customers)
	//   false → payer     (saved to inquiries.payer_*)
	// ---------------------------------------------------------------------------

	let contact = $state({
		salutation:     '',
		first_name:     '',
		last_name:      '',
		email:          '',
		phone:          '',
		date:           '',
		message:        '',
		company_name:   '',
		// Business: Ansprechpartner is the contact person
	});

	// Payer address — collected when bookingForSelf = false (for invoice)
	// Simpler than a full AddressBlock — no floor/elevator needed
	let payerAddress = $state({ street: '', number: '', zip: '', city: '' });

	// ---------------------------------------------------------------------------
	// Recipient fields  (only when bookingForSelf = false)
	// This person is the Leistungsempfänger — saved to customers.
	// Minimal: name + phone so the crew knows who to contact at the address.
	// Email optional — elderly relatives often don't have one.
	// ---------------------------------------------------------------------------

	let recipient = $state({
		salutation:  '',
		first_name:  '',
		last_name:   '',
		phone:       '',
		email:       '',
	});

	// ---------------------------------------------------------------------------
	// Address fields
	// ---------------------------------------------------------------------------

	interface AddressBlock {
		street:      string;
		number:      string;
		zip:         string;
		city:        string;
		floor:       string;
		elevator:    boolean;
		parking_ban: boolean;
	}

	const emptyAddress = (): AddressBlock => ({
		street: '', number: '', zip: '', city: '',
		floor: '', elevator: false, parking_ban: false,
	});

	let originAddress       = $state<AddressBlock>(emptyAddress());
	let destinationAddress  = $state<AddressBlock>(emptyAddress());
	let intermediateAddress = $state<AddressBlock>(emptyAddress());
	let billingAddress      = $state<AddressBlock>(emptyAddress());
	let showIntermediate    = $state(false);
	let showBilling         = $state(false);

	// ---------------------------------------------------------------------------
	// Add-ons
	// ---------------------------------------------------------------------------

	let selectedAddons = $state<string[]>([]);
	$effect(() => { selectedService; selectedAddons = []; });

	function toggleAddon(id: string) {
		selectedAddons = selectedAddons.includes(id)
			? selectedAddons.filter(a => a !== id)
			: [...selectedAddons, id];
	}

	// ---------------------------------------------------------------------------
	// Media
	// ---------------------------------------------------------------------------

	let attachments = $state<File[]>([]);

	// ---------------------------------------------------------------------------
	// Volume calculator
	// ---------------------------------------------------------------------------

	let volumeM3    = $state(0);
	let itemSummary = $state('');

	// ---------------------------------------------------------------------------
	// Custom fields (e.g. Umzugshelfer: helpers + hours)
	// Map from field id → current value; seeded from defaults when service changes.
	// ---------------------------------------------------------------------------

	let customFieldValues = $state<Record<string, number>>({});

	$effect(() => {
		const fields = selectedService?.customFields ?? [];
		const seeded: Record<string, number> = {};
		for (const f of fields) seeded[f.id] = f.default;
		customFieldValues = seeded;
	});

	// ---------------------------------------------------------------------------
	// Form validation per step
	// ---------------------------------------------------------------------------

	let privacyAccepted = $state(false);

	const contactValid = $derived(
		customerType === 'business'
			? (contact.company_name !== '' && contact.last_name !== '' && contact.email !== ''
				&& billingAddress.street !== '' && billingAddress.zip !== '' && billingAddress.city !== '')
			: bookingForSelf
				? (contact.last_name !== '' && contact.email !== '')
				: (contact.last_name !== '' && contact.email !== '' && recipient.last_name !== '')
	);

	const addrCfg = $derived(selectedService?.addressConfig);

	const addressValid = $derived(
		(!addrCfg?.showOrigin      || !addrCfg?.originRequired      || (originAddress.street      !== '' && originAddress.city      !== '')) &&
		(!addrCfg?.showDestination || !addrCfg?.destinationRequired || (destinationAddress.street !== '' && destinationAddress.city !== ''))
	);

	const detailsValid = $derived(
		privacyAccepted &&
		(activeMode !== 'foto' && activeMode !== 'video' || attachments.length > 0)
	);

	/** Whether "Weiter" should be enabled on the current step. */
	const canContinue = $derived(
		currentStep === 'service'  ? selectedService !== null :
		currentStep === 'mode'     ? true :
		currentStep === 'contact'  ? contactValid :
		currentStep === 'address'  ? addressValid :
		currentStep === 'details'  ? detailsValid : false
	);

	// ---------------------------------------------------------------------------
	// Submit
	// ---------------------------------------------------------------------------

	let isSubmitting  = $state(false);
	let submitSuccess = $state(false);
	let submitError   = $state('');
	let submitStatus  = $state('');

	// TODO: wire up — copy submit logic from old page, then add:
	//   fd.append('service_type',  selectedServiceId ?? '');
	//   fd.append('customer_type', customerType);
	//   if (customerType === 'business') fd.append('company_name', contact.company_name);
	//   if (showBilling)                 fd.append('billing_address', JSON.stringify(billingAddress));
	async function handleSubmit() {
		if (!detailsValid) return;
		isSubmitting = true;
	}
</script>

<svelte:head>
	<title>Kostenloses Angebot anfragen – Aust Umzüge</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="page">
	<div class="container">

		<!-- ================================================================
		  Progress indicator — dots + labels, adapts to active step list
		================================================================ -->
		<nav class="progress" aria-label="Fortschritt">
			{#each steps as stepId, i}
				{@const done    = i < currentStepIndex}
				{@const current = i === currentStepIndex}
				<div class="progress-step" aria-current={current ? 'step' : undefined}>
					<div class="progress-dot" class:done class:current>
						{#if done}<Check size={10} />{/if}
					</div>
					<span class="progress-label" class:current>{STEP_LABELS[stepId]}</span>
				</div>
				{#if i < steps.length - 1}
					<div class="progress-line" class:done={i < currentStepIndex}></div>
				{/if}
			{/each}
		</nav>

		<!-- ================================================================
		  Back button — appears above the step content on steps 1+
		================================================================ -->
		{#if canGoBack}
			<button type="button" class="back-btn" onclick={goBack}>
				<ChevronLeft size={18} />
				Zurück
			</button>
		{/if}

		<!-- ================================================================
		  Step content — {#key} forces DOM recreation → CSS animation re-runs
		================================================================ -->
		{#key currentStepIndex}
		<div class="step-body">

			<!-- ============================================================
			  STEP: service
			  Large card grid. Clicking auto-advances.
			============================================================ -->
			{#if currentStep === 'service'}
			<div class="step-header">
				<h1 class="step-title">Welche Leistung benötigen Sie?</h1>
				<p class="step-subtitle">Wählen Sie einfach aus — das Formular passt sich automatisch an.</p>
			</div>
			<div class="service-grid">
				{#each SERVICES as svc}
					<button
						type="button"
						class="service-card"
						class:selected={selectedServiceId === svc.id}
						onclick={() => pickService(svc.id)}
						aria-pressed={selectedServiceId === svc.id}
					>
						<span class="service-icon" aria-hidden="true">{svc.icon}</span>
						<span class="service-label">{svc.label}</span>
						<span class="service-desc">{svc.description}</span>
					</button>
				{/each}
			</div>

			<!-- ============================================================
			  STEP: mode
			  Full-height cards with description + perks list. Clicking auto-advances.
			============================================================ -->
			{:else if currentStep === 'mode'}
			<div class="step-header">
				<h1 class="step-title">Wie möchten Sie Ihr Angebot erhalten?</h1>
				<p class="step-subtitle">Wählen Sie die Methode, die am besten zu Ihnen passt.</p>
			</div>
			<div class="mode-cards">
				{#each selectedService!.allowedModes as modeId}
					{@const meta = MODE_META[modeId]}
					<button
						type="button"
						class="mode-card"
						class:selected={activeMode === modeId}
						onclick={() => pickMode(modeId)}
						aria-pressed={activeMode === modeId}
					>
						<div class="mode-card-header">
							<div class="mode-card-icon">
								<meta.icon size={22} />
							</div>
							<div>
								<div class="mode-card-label">{meta.label}</div>
								<div class="mode-card-tagline">{meta.tagline}</div>
							</div>
							{#if activeMode === modeId}
								<div class="mode-card-check"><Check size={16} /></div>
							{/if}
						</div>
						<p class="mode-card-desc">{meta.description}</p>
						<ul class="mode-card-perks">
							{#each meta.perks as perk}
								<li><Check size={13} /> {perk}</li>
							{/each}
						</ul>
					</button>
				{/each}
			</div>

			<!-- ============================================================
			  STEP: contact
			============================================================ -->
			{:else if currentStep === 'contact'}
			<div class="step-header">
				<h1 class="step-title">Kontaktdaten</h1>
				<p class="step-subtitle">
					{customerType === 'business'
						? 'Firmenanschrift und Ihr Ansprechpartner für dieses Projekt.'
						: bookingForSelf
							? 'So können wir Ihr Angebot vorbereiten und Sie erreichen.'
							: 'Ihre Angaben als Auftraggeber und die Angaben zur betreuten Person.'}
				</p>
			</div>

			<!-- ── Private / Business toggle (only for ambiguous services) ── -->
			{#if showCustomerTypeToggle}
			<div class="type-toggle" role="group" aria-label="Kundentyp">
				<button type="button" class="type-btn" class:active={customerType === 'private'}
					onclick={() => customerType = 'private'}>
					<User size={15} /> Privatkunde
				</button>
				<button type="button" class="type-btn" class:active={customerType === 'business'}
					onclick={() => customerType = 'business'}>
					<Building2 size={15} /> Geschäftskunde
				</button>
			</div>
			{/if}

			<!-- ══════════════════════════════════════════════════════════
			     BUSINESS FLOW
			══════════════════════════════════════════════════════════ -->
			{#if customerType === 'business'}

			<div class="contact-block">
				<div class="contact-block-header">
					<Building2 size={16} />
					<span>Firmenangaben</span>
				</div>
				<div class="field-row">
					<div class="field field--grow">
						<label for="company_name">Firmenname *</label>
						<input id="company_name" type="text" bind:value={contact.company_name}
							autocomplete="organization" required />
					</div>
				</div>
			</div>

			<div class="contact-block">
				<div class="contact-block-header">
					<MapPin size={16} />
					<span>Firmensitz / Rechnungsadresse</span>
				</div>
				<div class="field-row">
					<div class="field field--grow">
						<label for="ba_street">Straße *</label>
						<input id="ba_street" type="text" bind:value={billingAddress.street} autocomplete="street-address" required />
					</div>
					<div class="field field--shrink">
						<label for="ba_number">Nr.</label>
						<input id="ba_number" type="text" bind:value={billingAddress.number} />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--shrink">
						<label for="ba_zip">PLZ *</label>
						<input id="ba_zip" type="text" bind:value={billingAddress.zip} maxlength="5" autocomplete="postal-code" required />
					</div>
					<div class="field field--grow">
						<label for="ba_city">Ort *</label>
						<input id="ba_city" type="text" bind:value={billingAddress.city} autocomplete="address-level2" required />
					</div>
				</div>
			</div>

			<div class="contact-block">
				<div class="contact-block-header">
					<User size={16} />
					<span>Ansprechpartner</span>
				</div>
				<div class="field-row">
					<div class="field field--shrink">
						<label for="sal_b">Anrede</label>
						<select id="sal_b" bind:value={contact.salutation}>
							<option value="">–</option>
							<option>Herr</option><option>Frau</option><option>Divers</option>
						</select>
					</div>
					<div class="field field--grow">
						<label for="fn_b">Vorname</label>
						<input id="fn_b" type="text" bind:value={contact.first_name} autocomplete="given-name" />
					</div>
					<div class="field field--grow">
						<label for="ln_b">Nachname *</label>
						<input id="ln_b" type="text" bind:value={contact.last_name} autocomplete="family-name" required />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--half">
						<label for="email_b">E-Mail *</label>
						<input id="email_b" type="email" bind:value={contact.email} autocomplete="email" required />
					</div>
					<div class="field field--half">
						<label for="phone_b">Telefon</label>
						<input id="phone_b" type="tel" bind:value={contact.phone} autocomplete="tel" />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--half">
						<label for="date_b">Wunschtermin</label>
						<input id="date_b" type="date" bind:value={contact.date} />
					</div>
				</div>
			</div>

			<!-- ══════════════════════════════════════════════════════════
			     PRIVATE FLOW
			══════════════════════════════════════════════════════════ -->
			{:else}

			<!-- Booking-for selector — two option cards -->
			{#if showBookingForToggle}
			<div class="booking-for-cards" role="group" aria-label="Für wen buchen Sie?">
				<button
					type="button"
					class="booking-card"
					class:selected={bookingForSelf}
					onclick={() => bookingForSelf = true}
					aria-pressed={bookingForSelf}
				>
					<div class="booking-card-icon"><User size={20} /></div>
					<div>
						<div class="booking-card-label">Für mich selbst</div>
						<div class="booking-card-hint">Ich bin die Person, für die der Auftrag durchgeführt wird.</div>
					</div>
					{#if bookingForSelf}<div class="booking-card-check"><Check size={14} /></div>{/if}
				</button>
				<button
					type="button"
					class="booking-card"
					class:selected={!bookingForSelf}
					onclick={() => bookingForSelf = false}
					aria-pressed={!bookingForSelf}
				>
					<div class="booking-card-icon"><Users size={20} /></div>
					<div>
						<div class="booking-card-label">Für jemand anderen</div>
						<div class="booking-card-hint">z.B. Elternteil, Angehörige oder eine andere Person.</div>
					</div>
					{#if !bookingForSelf}<div class="booking-card-check"><Check size={14} /></div>{/if}
				</button>
			</div>
			{/if}

			{#if bookingForSelf}
			<!-- ── FOR MYSELF: single contact block ── -->
			<div class="contact-block">
				<div class="contact-block-header"><User size={16} /><span>Ihre Angaben</span></div>
				<div class="field-row">
					<div class="field field--shrink">
						<label for="sal_s">Anrede</label>
						<select id="sal_s" bind:value={contact.salutation}>
							<option value="">–</option>
							<option>Herr</option><option>Frau</option><option>Divers</option>
						</select>
					</div>
					<div class="field field--grow">
						<label for="fn_s">Vorname</label>
						<input id="fn_s" type="text" bind:value={contact.first_name} autocomplete="given-name" />
					</div>
					<div class="field field--grow">
						<label for="ln_s">Nachname *</label>
						<input id="ln_s" type="text" bind:value={contact.last_name} autocomplete="family-name" required />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--half">
						<label for="email_s">E-Mail *</label>
						<input id="email_s" type="email" bind:value={contact.email} autocomplete="email" required />
					</div>
					<div class="field field--half">
						<label for="phone_s">Telefon</label>
						<input id="phone_s" type="tel" bind:value={contact.phone} autocomplete="tel" />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--half">
						<label for="date_s">Wunschtermin</label>
						<input id="date_s" type="date" bind:value={contact.date} />
					</div>
				</div>
			</div>

			{:else}
			<!-- ── FOR SOMEONE ELSE: payer (me) + recipient (them) ── -->

			<!-- Your details = payer, receive invoice here -->
			<div class="contact-block">
				<div class="contact-block-header contact-block-header--payer">
					<User size={16} />
					<span>Ihre Angaben <em>(Auftraggeber)</em></span>
				</div>
				<div class="field-row">
					<div class="field field--shrink">
						<label for="sal_p">Anrede</label>
						<select id="sal_p" bind:value={contact.salutation}>
							<option value="">–</option>
							<option>Herr</option><option>Frau</option><option>Divers</option>
						</select>
					</div>
					<div class="field field--grow">
						<label for="fn_p">Vorname</label>
						<input id="fn_p" type="text" bind:value={contact.first_name} autocomplete="given-name" />
					</div>
					<div class="field field--grow">
						<label for="ln_p">Nachname *</label>
						<input id="ln_p" type="text" bind:value={contact.last_name} autocomplete="family-name" required />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--half">
						<label for="email_p">E-Mail *</label>
						<input id="email_p" type="email" bind:value={contact.email} autocomplete="email" required />
					</div>
					<div class="field field--half">
						<label for="phone_p">Telefon</label>
						<input id="phone_p" type="tel" bind:value={contact.phone} autocomplete="tel" />
					</div>
				</div>
				<!-- Payer address — for invoice -->
				<div class="field-hint">Ihre Adresse (für die Rechnung)</div>
				<div class="field-row">
					<div class="field field--grow">
						<label for="pstr">Straße</label>
						<input id="pstr" type="text" bind:value={payerAddress.street} autocomplete="street-address" />
					</div>
					<div class="field field--shrink">
						<label for="pnum">Nr.</label>
						<input id="pnum" type="text" bind:value={payerAddress.number} />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--shrink">
						<label for="pzip">PLZ</label>
						<input id="pzip" type="text" bind:value={payerAddress.zip} maxlength="5" autocomplete="postal-code" />
					</div>
					<div class="field field--grow">
						<label for="pcity">Ort</label>
						<input id="pcity" type="text" bind:value={payerAddress.city} autocomplete="address-level2" />
					</div>
				</div>
			</div>

			<!-- Recipient details — the person the service is for -->
			<div class="contact-block contact-block--recipient">
				<div class="contact-block-header contact-block-header--recipient">
					<Users size={16} />
					<span>Angaben zur betreuten Person</span>
				</div>
				<div class="field-row">
					<div class="field field--shrink">
						<label for="sal_r">Anrede</label>
						<select id="sal_r" bind:value={recipient.salutation}>
							<option value="">–</option>
							<option>Herr</option><option>Frau</option><option>Divers</option>
						</select>
					</div>
					<div class="field field--grow">
						<label for="fn_r">Vorname</label>
						<input id="fn_r" type="text" bind:value={recipient.first_name} />
					</div>
					<div class="field field--grow">
						<label for="ln_r">Nachname *</label>
						<input id="ln_r" type="text" bind:value={recipient.last_name} required />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--half">
						<label for="phone_r">Telefon vor Ort</label>
						<input id="phone_r" type="tel" bind:value={recipient.phone} />
					</div>
					<div class="field field--half">
						<label for="email_r">E-Mail <span class="optional">(optional)</span></label>
						<input id="email_r" type="email" bind:value={recipient.email} />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--half">
						<label for="date_r">Wunschtermin</label>
						<input id="date_r" type="date" bind:value={contact.date} />
					</div>
				</div>
			</div>
			{/if}

			{/if}
			<!-- end business/private switch -->

			<div class="step-nav">
				<button type="button" class="btn-primary" disabled={!canContinue} onclick={goNext}>
					Weiter
				</button>
			</div>

			<!-- ============================================================
			  STEP: address
			============================================================ -->
			{:else if currentStep === 'address'}
			<div class="step-header">
				<h1 class="step-title">Adressdaten</h1>
				<p class="step-subtitle">
					{selectedService?.addressConfig.showDestination
						? 'Von wo nach wo ziehen Sie um?'
						: 'Wo soll unser Team eingesetzt werden?'}
				</p>
			</div>

			{#if selectedService?.addressConfig.showOrigin}
			<div class="address-block">
				<h3 class="address-block-title">{selectedService.addressConfig.originLabel}</h3>
				<div class="field-row">
					<div class="field field--grow">
						<label>Straße *</label>
						<input type="text" bind:value={originAddress.street} autocomplete="street-address" required />
					</div>
					<div class="field field--shrink">
						<label>Nr.</label>
						<input type="text" bind:value={originAddress.number} />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--shrink">
						<label>PLZ *</label>
						<input type="text" bind:value={originAddress.zip} maxlength="5" autocomplete="postal-code" required />
					</div>
					<div class="field field--grow">
						<label>Ort *</label>
						<input type="text" bind:value={originAddress.city} autocomplete="address-level2" required />
					</div>
					<div class="field field--quarter">
						<label>Etage</label>
						<select bind:value={originAddress.floor}>
							{#each floorOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
						</select>
					</div>
				</div>
				<div class="checks-row">
					<label class="check-label">
						<input type="checkbox" bind:checked={originAddress.elevator} />
						Aufzug vorhanden
					</label>
					<label class="check-label">
						<input type="checkbox" bind:checked={originAddress.parking_ban} />
						Halteverbotszone nötig
					</label>
				</div>
			</div>
			{/if}

			{#if selectedService?.addressConfig.showIntermediate}
			<div class="expand-row">
				<button
					type="button"
					class="expand-btn"
					onclick={() => showIntermediate = !showIntermediate}
					aria-expanded={showIntermediate}
				>
					{showIntermediate ? '−' : '+'} Zwischenstopp hinzufügen
				</button>
			</div>
			{#if showIntermediate}
			<div class="address-block address-block--dashed">
				<h3 class="address-block-title">Zwischenstopp</h3>
				<div class="field-row">
					<div class="field field--grow">
						<label>Straße</label>
						<input type="text" bind:value={intermediateAddress.street} />
					</div>
					<div class="field field--shrink">
						<label>Nr.</label>
						<input type="text" bind:value={intermediateAddress.number} />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--shrink">
						<label>PLZ</label>
						<input type="text" bind:value={intermediateAddress.zip} maxlength="5" />
					</div>
					<div class="field field--grow">
						<label>Ort</label>
						<input type="text" bind:value={intermediateAddress.city} />
					</div>
					<div class="field field--quarter">
						<label>Etage</label>
						<select bind:value={intermediateAddress.floor}>
							{#each floorOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
						</select>
					</div>
				</div>
			</div>
			{/if}
			{/if}

			{#if selectedService?.addressConfig.showDestination}
			<div class="address-block">
				<h3 class="address-block-title">{selectedService.addressConfig.destinationLabel}</h3>
				<div class="field-row">
					<div class="field field--grow">
						<label>Straße *</label>
						<input type="text" bind:value={destinationAddress.street} required />
					</div>
					<div class="field field--shrink">
						<label>Nr.</label>
						<input type="text" bind:value={destinationAddress.number} />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--shrink">
						<label>PLZ *</label>
						<input type="text" bind:value={destinationAddress.zip} maxlength="5" required />
					</div>
					<div class="field field--grow">
						<label>Ort *</label>
						<input type="text" bind:value={destinationAddress.city} required />
					</div>
					<div class="field field--quarter">
						<label>Etage</label>
						<select bind:value={destinationAddress.floor}>
							{#each floorOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
						</select>
					</div>
				</div>
				<div class="checks-row">
					<label class="check-label">
						<input type="checkbox" bind:checked={destinationAddress.elevator} />
						Aufzug vorhanden
					</label>
					<label class="check-label">
						<input type="checkbox" bind:checked={destinationAddress.parking_ban} />
						Halteverbotszone nötig
					</label>
				</div>
			</div>
			{/if}

			{#if selectedService?.addressConfig.showBilling}
			<div class="expand-row">
				<button
					type="button"
					class="expand-btn"
					onclick={() => showBilling = !showBilling}
					aria-expanded={showBilling}
				>
					{showBilling ? '−' : '+'} Abweichende Rechnungsadresse angeben
				</button>
			</div>
			{#if showBilling}
			<div class="address-block address-block--dashed">
				<h3 class="address-block-title">Rechnungsadresse</h3>
				<div class="field-row">
					<div class="field field--grow">
						<label>Straße</label>
						<input type="text" bind:value={billingAddress.street} />
					</div>
					<div class="field field--shrink">
						<label>Nr.</label>
						<input type="text" bind:value={billingAddress.number} />
					</div>
				</div>
				<div class="field-row">
					<div class="field field--shrink">
						<label>PLZ</label>
						<input type="text" bind:value={billingAddress.zip} maxlength="5" />
					</div>
					<div class="field field--grow">
						<label>Ort</label>
						<input type="text" bind:value={billingAddress.city} />
					</div>
				</div>
			</div>
			{/if}
			{/if}

			<div class="step-nav">
				<button
					type="button"
					class="btn-primary"
					disabled={!canContinue}
					onclick={goNext}
				>
					Weiter
				</button>
			</div>

			<!-- ============================================================
			  STEP: details  (upload / volume / addons / message / submit)
			============================================================ -->
			{:else if currentStep === 'details'}
			<div class="step-header">
				<h1 class="step-title">Fast geschafft!</h1>
				<p class="step-subtitle">Noch ein paar Details, dann ist Ihre Anfrage fertig.</p>
			</div>

			<!-- Volume calculator (manuell + volume-bearing services) -->
			{#if activeMode === 'manuell' && selectedService?.showVolumeCalculator}
			<div class="subsection">
				<h2 class="subsection-title">Umzugsgut erfassen</h2>
				<VolumeCalculator bind:volumeM3 bind:itemSummary />
			</div>
			{/if}

			<!-- Media upload (foto / video) -->
			{#if activeMode === 'foto' || activeMode === 'video'}
			<div class="subsection">
				<h2 class="subsection-title">
					{activeMode === 'foto' ? 'Fotos hochladen' : 'Video hochladen'}
				</h2>
				<p class="subsection-hint">
					{activeMode === 'foto'
						? 'Laden Sie Fotos aller Räume hoch. 2–3 Bilder pro Raum aus verschiedenen Blickwinkeln genügen.'
						: 'Laden Sie ein Video hoch, in dem Sie durch alle Räume gehen. Ein ruhiger Durchgang reicht.'}
				</p>
				<MediaDropzone
					accept={activeMode === 'foto' ? 'image/*' : 'video/*'}
					multiple={activeMode === 'foto'}
					hasFiles={attachments.length > 0}
					onfiles={(f) => attachments = [...attachments, ...f]}
				/>
				{#if attachments.length > 0}
					<MediaPreviewGrid
						files={attachments}
						mode={activeMode === 'foto' ? 'thumbnails' : 'queue'}
						onremove={(i) => attachments = attachments.filter((_, j) => j !== i)}
					/>
				{/if}
			</div>
			{/if}

			<!-- Custom fields (Umzugshelfer: helpers + hours) -->
			{#if selectedService && selectedService.customFields.length > 0}
			<div class="subsection">
				<h2 class="subsection-title">Umfang</h2>
				<div class="custom-fields">
					{#each selectedService.customFields as field}
					<div class="stepper-row">
						<span class="stepper-label">{field.label}</span>
						<div class="stepper">
							<button
								type="button"
								class="stepper-btn"
								disabled={(customFieldValues[field.id] ?? field.default) <= field.min}
								onclick={() => customFieldValues[field.id] = Math.max(field.min, (customFieldValues[field.id] ?? field.default) - field.step)}
							>−</button>
							<span class="stepper-value">
								{customFieldValues[field.id] ?? field.default}
								<span class="stepper-unit">{field.unit}</span>
							</span>
							<button
								type="button"
								class="stepper-btn"
								disabled={(customFieldValues[field.id] ?? field.default) >= field.max}
								onclick={() => customFieldValues[field.id] = Math.min(field.max, (customFieldValues[field.id] ?? field.default) + field.step)}
							>+</button>
						</div>
					</div>
					{/each}
				</div>
			</div>
			{/if}

			<!-- Add-ons -->
			{#if selectedService && selectedService.additionalServices.length > 0}
			<div class="subsection">
				<h2 class="subsection-title">Zusatzleistungen</h2>
				<div class="addon-list">
					{#each selectedService.additionalServices as addon}
						<label class="addon-label">
							<input
								type="checkbox"
								checked={selectedAddons.includes(addon.id)}
								onchange={() => toggleAddon(addon.id)}
							/>
							{addon.label}
						</label>
					{/each}
				</div>
			</div>
			{/if}

			<!-- Message -->
			<div class="subsection">
				<div class="field">
					<label for="message">Nachricht (optional)</label>
					<textarea id="message" rows="3" bind:value={contact.message}></textarea>
				</div>
			</div>

			<!-- Privacy + Submit -->
			<label class="privacy-label">
				<input type="checkbox" bind:checked={privacyAccepted} required />
				Ich habe die
				<a href="/datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a>
				gelesen und akzeptiere diese. *
			</label>

			{#if submitError}
				<p class="submit-error">{submitError}</p>
			{/if}

			{#if submitSuccess}
				<div class="submit-success">
					<Check size={20} />
					<div>
						<strong>Vielen Dank!</strong>
						Wir melden uns so schnell wie möglich bei Ihnen.
					</div>
				</div>
			{:else}
				<div class="step-nav">
					<button
						type="button"
						class="btn-submit"
						disabled={!canContinue || isSubmitting}
						onclick={handleSubmit}
					>
						<Send size={17} />
						{isSubmitting ? (submitStatus || 'Wird gesendet…') : 'Angebot anfordern'}
					</button>
				</div>
			{/if}

			{/if}
			<!-- end step switch -->

		</div>
		{/key}

	</div>
</main>

<style>
	/* -------------------------------------------------------------------------
	   Page shell
	------------------------------------------------------------------------- */
	.page      { padding: 3rem 0 5rem; min-height: 60vh; }
	.container { max-width: 720px; margin: 0 auto; padding: 0 1.25rem; }

	/* -------------------------------------------------------------------------
	   Fade-lift animation — triggered by {#key currentStepIndex}
	------------------------------------------------------------------------- */
	@keyframes stepIn {
		from { opacity: 0; transform: translateY(18px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.step-body {
		animation: stepIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	/* -------------------------------------------------------------------------
	   Progress indicator
	------------------------------------------------------------------------- */
	.progress {
		display: flex;
		align-items: flex-start;
		margin-bottom: 2.25rem;
	}

	.progress-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		flex-shrink: 0;
	}

	.progress-dot {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 2px solid #d1d5db;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		transition: all 0.25s ease;
	}

	.progress-dot.done {
		background: var(--dt-primary, #022448);
		border-color: var(--dt-primary, #022448);
	}

	.progress-dot.current {
		background: var(--dt-primary, #022448);
		border-color: var(--dt-primary, #022448);
		box-shadow: 0 0 0 4px rgba(2, 36, 72, 0.12);
		width: 26px;
		height: 26px;
	}

	.progress-label {
		font-size: 0.68rem;
		color: #9ca3af;
		white-space: nowrap;
		letter-spacing: 0.01em;
	}

	.progress-label.current {
		color: var(--dt-primary, #022448);
		font-weight: 600;
	}

	.progress-line {
		flex: 1;
		height: 2px;
		background: #e5e7eb;
		margin: 0 4px;
		margin-top: 11px; /* align with dot centre */
		align-self: flex-start;
		transition: background 0.3s ease;
	}

	.progress-line.done { background: var(--dt-primary, #022448); }

	/* -------------------------------------------------------------------------
	   Back button
	------------------------------------------------------------------------- */
	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: none;
		border: none;
		color: var(--dt-primary, #022448);
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0.25rem 0;
		margin-bottom: 1.25rem;
		opacity: 0.75;
		transition: opacity 0.15s;
	}

	.back-btn:hover { opacity: 1; }

	/* -------------------------------------------------------------------------
	   Step header
	------------------------------------------------------------------------- */
	.step-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--dt-primary, #022448);
		margin-bottom: 0.4rem;
		line-height: 1.2;
	}

	.step-subtitle {
		color: #6b7280;
		font-size: 0.95rem;
		margin-bottom: 1.75rem;
	}

	/* -------------------------------------------------------------------------
	   Service selection grid
	------------------------------------------------------------------------- */
	.service-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.65rem;
	}

	@media (max-width: 560px) {
		.service-grid { grid-template-columns: repeat(2, 1fr); }
	}

	.service-card {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.9rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		background: #fff;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s, background 0.15s, transform 0.1s;
	}

	.service-card:hover {
		border-color: var(--dt-primary, #022448);
		background: #f8fafc;
		transform: translateY(-1px);
	}

	.service-card.selected {
		border-color: var(--dt-primary, #022448);
		background: var(--dt-primary, #022448);
		color: #fff;
		transform: translateY(-1px);
	}

	.service-icon  { font-size: 1.5rem; line-height: 1; }
	.service-label { font-weight: 600; font-size: 0.92rem; }
	.service-desc  { font-size: 0.75rem; opacity: 0.65; line-height: 1.35; }

	/* -------------------------------------------------------------------------
	   Mode cards (step 2)
	------------------------------------------------------------------------- */
	.mode-cards {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.mode-card {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.25rem 1.4rem;
		border: 2px solid #e5e7eb;
		border-radius: 14px;
		background: #fff;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s, background 0.15s, transform 0.1s;
	}

	.mode-card:hover {
		border-color: #94a3b8;
		background: #f8fafc;
		transform: translateY(-1px);
	}

	.mode-card.selected {
		border-color: var(--dt-primary, #022448);
		background: #f0f5fb;
	}

	.mode-card-header {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
	}

	.mode-card-icon {
		width: 42px;
		height: 42px;
		border-radius: 10px;
		background: var(--dt-primary, #022448);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.mode-card.selected .mode-card-icon { background: var(--dt-primary, #022448); }

	.mode-card-label   { font-weight: 700; font-size: 1rem; color: #111827; }
	.mode-card-tagline { font-size: 0.82rem; color: #6b7280; margin-top: 0.1rem; }

	.mode-card-check {
		margin-left: auto;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--dt-primary, #022448);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.mode-card-desc {
		font-size: 0.88rem;
		color: #4b5563;
		line-height: 1.55;
		margin: 0;
	}

	.mode-card-perks {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.mode-card-perks li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.82rem;
		color: #166534;
		font-weight: 500;
	}

	/* -------------------------------------------------------------------------
	   Customer type toggle
	------------------------------------------------------------------------- */
	.type-toggle {
		display: inline-flex;
		border: 2px solid #e5e7eb;
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.type-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 1.3rem;
		background: #fff;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		color: #6b7280;
		transition: background 0.15s, color 0.15s;
	}

	.type-btn:not(:first-child) { border-left: 2px solid #e5e7eb; }
	.type-btn.active { background: var(--dt-primary, #022448); color: #fff; }

	/* -------------------------------------------------------------------------
	   Booking-for selector cards
	------------------------------------------------------------------------- */
	.booking-for-cards {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 1.5rem;
	}

	.booking-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.1rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		background: #fff;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s, background 0.15s;
	}

	.booking-card:hover        { border-color: #94a3b8; background: #f8fafc; }
	.booking-card.selected     { border-color: var(--dt-primary, #022448); background: #f0f5fb; }

	.booking-card-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: #f1f5f9;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--dt-primary, #022448);
		flex-shrink: 0;
		transition: background 0.15s;
	}

	.booking-card.selected .booking-card-icon { background: var(--dt-primary, #022448); color: #fff; }

	.booking-card-label { font-weight: 600; font-size: 0.95rem; color: #111827; }
	.booking-card-hint  { font-size: 0.8rem; color: #6b7280; margin-top: 0.15rem; }

	.booking-card-check {
		margin-left: auto;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--dt-primary, #022448);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* -------------------------------------------------------------------------
	   Contact blocks — grouped sections within the contact step
	------------------------------------------------------------------------- */
	.contact-block {
		border: 1.5px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.1rem 1.2rem;
		margin-bottom: 1rem;
		background: #fafbfc;
	}

	.contact-block--recipient { background: #f8fafc; border-color: #cbd5e1; }

	.contact-block-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 1rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.contact-block-header em { font-style: normal; font-weight: 400; color: #9ca3af; }

	.contact-block-header--payer    { color: var(--dt-primary, #022448); }
	.contact-block-header--recipient { color: #0f766e; }
	.contact-block--recipient .contact-block-header { border-bottom-color: #b2e8e0; }

	.field-hint {
		font-size: 0.8rem;
		color: #6b7280;
		margin-bottom: 0.5rem;
		margin-top: 0.25rem;
	}

	.optional { font-size: 0.75rem; color: #9ca3af; font-weight: 400; }

	/* -------------------------------------------------------------------------
	   Form fields
	------------------------------------------------------------------------- */
	.field-row {
		display: flex;
		gap: 0.65rem;
		margin-bottom: 0.65rem;
		flex-wrap: wrap;
	}

	.checks-row {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		margin-top: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.field { display: flex; flex-direction: column; gap: 0.28rem; min-width: 0; }
	.field--grow    { flex: 1 1 auto; }
	.field--half    { flex: 1 1 calc(50% - 0.325rem); }
	.field--shrink  { flex: 0 0 90px; }
	.field--quarter { flex: 0 0 130px; }

	.field label { font-size: 0.82rem; font-weight: 500; color: #374151; }

	.field input,
	.field select,
	.field textarea {
		padding: 0.55rem 0.8rem;
		border: 1.5px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.93rem;
		background: #fff;
		width: 100%;
		box-sizing: border-box;
		transition: border-color 0.15s;
		color: #111827;
	}

	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--dt-primary, #022448);
		box-shadow: 0 0 0 3px rgba(2, 36, 72, 0.08);
	}

	/* -------------------------------------------------------------------------
	   Address blocks
	------------------------------------------------------------------------- */
	.address-block {
		padding: 1.1rem 1.2rem;
		border: 1.5px solid #e5e7eb;
		border-radius: 12px;
		margin-bottom: 1rem;
		background: #fafbfc;
	}

	.address-block--dashed {
		border-style: dashed;
		background: #f8f8f8;
	}

	.address-block-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.85rem;
	}

	.check-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.87rem;
		cursor: pointer;
		color: #374151;
	}

	.expand-row { margin-bottom: 0.85rem; }

	.expand-btn {
		background: none;
		border: none;
		color: var(--dt-primary, #022448);
		cursor: pointer;
		font-size: 0.88rem;
		font-weight: 500;
		padding: 0.2rem 0;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* -------------------------------------------------------------------------
	   Details step: subsections
	------------------------------------------------------------------------- */
	.subsection {
		margin-bottom: 1.75rem;
	}

	.subsection-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-primary, #022448);
		margin-bottom: 0.65rem;
		padding-bottom: 0.4rem;
		border-bottom: 1.5px solid #e5e7eb;
	}

	.subsection-hint {
		font-size: 0.85rem;
		color: #6b7280;
		margin-bottom: 0.85rem;
	}

	/* -------------------------------------------------------------------------
	   Add-ons
	------------------------------------------------------------------------- */
	/* -------------------------------------------------------------------------
	   Custom field steppers (helpers / hours)
	------------------------------------------------------------------------- */
	.custom-fields { display: flex; flex-direction: column; gap: 0.85rem; }

	.stepper-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.stepper-label { font-size: 0.95rem; color: #374151; font-weight: 500; }

	.stepper {
		display: flex;
		align-items: center;
		gap: 0;
		border: 1.5px solid #d1d5db;
		border-radius: 10px;
		overflow: hidden;
	}

	.stepper-btn {
		width: 40px;
		height: 40px;
		background: #f9fafb;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: var(--dt-primary, #022448);
		transition: background 0.15s;
		line-height: 1;
	}

	.stepper-btn:hover:not(:disabled) { background: #e5e7eb; }
	.stepper-btn:disabled { color: #d1d5db; cursor: not-allowed; }

	.stepper-value {
		min-width: 80px;
		text-align: center;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		border-left: 1.5px solid #d1d5db;
		border-right: 1.5px solid #d1d5db;
		padding: 0 0.5rem;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
	}

	.stepper-unit { font-size: 0.78rem; font-weight: 400; color: #6b7280; }

	.addon-list  { display: flex; flex-direction: column; gap: 0.55rem; }
	.addon-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.93rem; cursor: pointer; }

	/* -------------------------------------------------------------------------
	   Privacy + submit
	------------------------------------------------------------------------- */
	.privacy-label {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #4b5563;
		margin-bottom: 1.25rem;
		line-height: 1.5;
		cursor: pointer;
	}

	.privacy-label a { color: var(--dt-primary, #022448); }

	/* -------------------------------------------------------------------------
	   Navigation buttons
	------------------------------------------------------------------------- */
	.step-nav {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.5rem;
		gap: 0.75rem;
	}

	.btn-primary,
	.btn-submit {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.72rem 2rem;
		background: var(--dt-primary, #022448);
		color: #fff;
		border: none;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
	}

	.btn-primary:hover:not(:disabled),
	.btn-submit:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.btn-primary:disabled,
	.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

	/* -------------------------------------------------------------------------
	   Error / success
	------------------------------------------------------------------------- */
	.submit-error {
		color: #991b1b;
		background: #fee2e2;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.88rem;
		margin-bottom: 1rem;
	}

	.submit-success {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		color: #166534;
		background: #dcfce7;
		padding: 1rem 1.25rem;
		border-radius: 10px;
		font-size: 0.95rem;
	}
</style>
