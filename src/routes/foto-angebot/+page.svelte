<script lang="ts">
	import { Send, Camera, Video, Calendar, ClipboardList } from "lucide-svelte";
	import MediaDropzone from '$lib/components/MediaDropzone.svelte';
	import MediaPreviewGrid from '$lib/components/MediaPreviewGrid.svelte';

	const PHOTO_API_URL = import.meta.env.VITE_PHOTO_API_URL || "https://api.aufraeumhelden.com/api/v1/submit/photo";
	const VIDEO_API_URL = import.meta.env.VITE_VIDEO_API_URL || "https://api.aufraeumhelden.com/api/v1/submit/video";
	const PHP_URL = "/send-mail.php";

	type Mode = "termin" | "manuell" | "foto" | "video";

	const modes: { id: Mode; label: string; icon: typeof Camera; hint: string }[] = [
		{ id: "termin",  label: "Via Termin", icon: Calendar,      hint: "Termin vereinbaren — wir kommen kostenlos vorbei" },
		{ id: "manuell", label: "Manuell",    icon: ClipboardList, hint: "Adresse & Details angeben — wir berechnen das Volumen" },
		{ id: "foto",    label: "Fotos",      icon: Camera,        hint: "Raumfotos hochladen — KI berechnet Volumen automatisch" },
		{ id: "video",   label: "Video",      icon: Video,         hint: "Rundgang-Video hochladen — präziseste 3D-Analyse" },
	];

	const floorOptions = [
		{ value: "", label: "Bitte wählen" },
		{ value: "Erdgeschoss", label: "Erdgeschoss" },
		{ value: "Hochparterre", label: "Hochparterre" },
		{ value: "1. Stock", label: "1. Stock" },
		{ value: "2. Stock", label: "2. Stock" },
		{ value: "3. Stock", label: "3. Stock" },
		{ value: "4. Stock", label: "4. Stock" },
		{ value: "5. Stock", label: "5. Stock" },
		{ value: "6. Stock", label: "6. Stock" },
		{ value: "Höher als 6. Stock", label: "Höher als 6. Stock" },
	];

	const additionalServices = [
		{ id: "Möbeldemontage", label: "Möbeldemontage" },
		{ id: "Möbelmontage",   label: "Möbelmontage" },
		{ id: "Einpackservice", label: "Einpackservice" },
		{ id: "Einlagerung",    label: "Einlagerung" },
		{ id: "Entsorgung",     label: "Entsorgung" },
	];

	let activeMode = $state<Mode>("termin");

	// Shared form state
	let formData = $state({
		name: "",
		salutation: "",
		first_name: "",
		last_name: "",
		email: "",
		phone: "",
		date: "",
		startStrasse: "",
		startHausnummer: "",
		startPlz: "",
		startOrt: "",
		startFloor: "",
		aufzugAuszug: false,
		halteverbotAuszug: false,
		endStrasse: "",
		endHausnummer: "",
		endPlz: "",
		endOrt: "",
		endFloor: "",
		aufzugEinzug: false,
		halteverbotEinzug: false,
		selectedServices: [] as string[],
		message: "",
		privacyAccepted: false,
	});

	// Unified media — any file, any format, any amount
	let attachments = $state<File[]>([]);

	let isSubmitting  = $state(false);
	let submitSuccess = $state(false);
	let submitError   = $state("");

	const hasAddresses = $derived(
		formData.startStrasse !== "" && formData.startOrt !== "" &&
		formData.endStrasse   !== "" && formData.endOrt   !== "",
	);

	const isBaseValid = $derived(
		(formData.last_name !== "" || formData.name !== "") &&
		formData.email !== "" &&
		formData.privacyAccepted,
	);

	// Termin: base required, addresses optional
	const isTerminValid = $derived(isBaseValid);

	// Manuell / foto / video: addresses always required
	const isManuellValid = $derived(isBaseValid && hasAddresses);
	const isFotoValid    = $derived(isManuellValid && attachments.length > 0);
	const isVideoValid   = $derived(isManuellValid && attachments.length > 0);

	const isFormValid = $derived(
		activeMode === "termin"  ? isTerminValid  :
		activeMode === "manuell" ? isManuellValid :
		activeMode === "foto"    ? isFotoValid    :
		isVideoValid,
	);

	function buildAddressStr() {
		return {
			dep: `${formData.startStrasse} ${formData.startHausnummer}, ${formData.startPlz} ${formData.startOrt}`,
			arr: `${formData.endStrasse} ${formData.endHausnummer}, ${formData.endPlz} ${formData.endOrt}`,
		};
	}

	function toggleService(id: string) {
		if (formData.selectedServices.includes(id)) {
			formData.selectedServices = formData.selectedServices.filter(s => s !== id);
		} else {
			formData.selectedServices = [...formData.selectedServices, id];
		}
	}

	// ---- Submit ----
	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!isFormValid || isSubmitting) return;
		isSubmitting = true;
		submitError = "";

		try {
			if (activeMode === "video" && attachments.length > 0) {
				await submitVideo();
			} else if (attachments.length > 0 || activeMode === "foto") {
				await submitApi(PHOTO_API_URL);
			} else if (activeMode === "termin") {
				await submitPhp("via-termin");
			} else {
				await submitPhp("manuell-angebot");
			}
			submitSuccess = true;
		} catch (err: unknown) {
			submitError = err instanceof Error ? err.message : "Unbekannter Fehler. Bitte erneut versuchen.";
		} finally {
			isSubmitting = false;
		}
	}

	async function submitPhp(formName: string) {
		const fd = new FormData();
		fd.append("form-name", formName);
		fd.append("bot-field", "");
		fd.append("name", formData.last_name ? `${formData.first_name} ${formData.last_name}`.trim() : formData.name);
		if (formData.salutation) fd.append("anrede", formData.salutation);
		if (formData.first_name) fd.append("vorname", formData.first_name);
		if (formData.last_name)  fd.append("nachname", formData.last_name);
		fd.append("email", formData.email);
		if (formData.phone)   fd.append("phone", formData.phone);
		if (formData.date)    fd.append("wunschtermin", formData.date);
		if (formData.message) fd.append("nachricht", formData.message);

		if (formName === "manuell-angebot") {
			const { dep, arr } = buildAddressStr();
			fd.append("auszugsadresse", dep);
			if (formData.startFloor) fd.append("etage_auszug", formData.startFloor);
			fd.append("aufzug_auszug",      formData.aufzugAuszug      ? "true" : "false");
			fd.append("halteverbot_auszug", formData.halteverbotAuszug ? "true" : "false");
			fd.append("einzugsadresse", arr);
			if (formData.endFloor) fd.append("etage_einzug", formData.endFloor);
			fd.append("aufzug_einzug",      formData.aufzugEinzug      ? "true" : "false");
			fd.append("halteverbot_einzug", formData.halteverbotEinzug ? "true" : "false");
			if (formData.selectedServices.length > 0) {
				fd.append("zusatzleistungen", formData.selectedServices.join(", "));
			}
		} else if (formName === "via-termin") {
			if (formData.startStrasse && formData.startOrt) fd.append("auszugsadresse", buildAddressStr().dep);
			if (formData.endStrasse   && formData.endOrt)   fd.append("einzugsadresse", buildAddressStr().arr);
		}

		const res = await fetch(PHP_URL, { method: "POST", body: fd });
		const data = await res.json().catch(() => null);
		if (!res.ok) throw new Error(data?.error || `Fehler (${res.status})`);
	}

	function buildCommonFd() {
		const fd = new FormData();
		const { dep, arr } = buildAddressStr();
		fd.append("name", formData.last_name ? `${formData.first_name} ${formData.last_name}`.trim() : formData.name);
		if (formData.salutation) fd.append("anrede", formData.salutation);
		if (formData.first_name) fd.append("vorname", formData.first_name);
		if (formData.last_name)  fd.append("nachname", formData.last_name);
		fd.append("email", formData.email);
		if (formData.phone) fd.append("phone", formData.phone);
		if (formData.date)  fd.append("wunschtermin", formData.date);
		fd.append("auszugsadresse", dep);
		if (formData.startFloor) fd.append("etage_auszug", formData.startFloor);
		fd.append("aufzug_auszug",      formData.aufzugAuszug      ? "true" : "false");
		fd.append("halteverbot_auszug", formData.halteverbotAuszug ? "true" : "false");
		fd.append("einzugsadresse", arr);
		if (formData.endFloor) fd.append("etage_einzug", formData.endFloor);
		fd.append("aufzug_einzug",      formData.aufzugEinzug      ? "true" : "false");
		fd.append("halteverbot_einzug", formData.halteverbotEinzug ? "true" : "false");
		if (formData.selectedServices.length > 0) fd.append("zusatzleistungen", formData.selectedServices.join(", "));
		if (formData.message) fd.append("nachricht", formData.message);
		return fd;
	}

	// Photo/manuell/termin API — all attachments go as images[] (backend accepts any MIME)
	async function submitApi(url: string) {
		const fd = buildCommonFd();
		for (const f of attachments) fd.append("images", f);
		const res = await fetch(url, { method: "POST", body: fd });
		if (!res.ok && res.status !== 202) {
			const data = await res.json().catch(() => null);
			throw new Error(data?.message || data?.detail || `Fehler (${res.status})`);
		}
	}

	// Video API — all attachments go as video fields (backend accepts any MIME)
	async function submitVideo() {
		const fd = buildCommonFd();
		for (const f of attachments) fd.append("video", f);
		const res = await fetch(VIDEO_API_URL, { method: "POST", body: fd });
		if (!res.ok && res.status !== 202) {
			const data = await res.json().catch(() => null);
			throw new Error(data?.message || data?.detail || `Fehler (${res.status})`);
		}
	}

	// Success messages per mode
	const successMessages: Record<Mode, { title: string; body: string }> = {
		termin:  { title: "Terminanfrage erhalten!", body: "Wir melden uns innerhalb eines Werktages, um einen passenden Termin zu vereinbaren." },
		manuell: { title: "Anfrage eingegangen!", body: "Wir prüfen Ihre Angaben und senden Ihnen in Kürze ein kostenloses Angebot per E-Mail." },
		foto:    { title: "Dateien hochgeladen!", body: "Unsere KI analysiert Ihre Aufnahmen und Sie erhalten in Kürze ein präzises Angebot per E-Mail." },
		video:   { title: "Dateien hochgeladen!", body: "Unsere 3D-Analyse läuft und Sie erhalten in Kürze ein sehr genaues Angebot per E-Mail." },
	};
</script>

<svelte:head>
	<title>Kostenloses Angebot | Aust Umzüge</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="ap">
	<div class="ap__container">
		<header class="ap__header">
			<h1 class="ap__heading">Kostenloses Angebot anfordern</h1>
			<p class="ap__subheading">
				Wählen Sie, wie wir Ihr Umzugsvolumen ermitteln sollen — von einfach bis hochpräzise.
			</p>
		</header>

		{#if submitSuccess}
			<div class="ap__success">
				<div class="ap__success-icon">✓</div>
				<h2>{successMessages[activeMode].title}</h2>
				<p>{successMessages[activeMode].body}</p>
				<a href="/" class="ap__btn ap__btn--center">Zur Startseite</a>
			</div>
		{:else}
			<!-- Mode Selector -->
			<div class="ap__mode-selector">
				{#each modes as m}
					<button
						type="button"
						class="ap__mode-btn"
						class:ap__mode-btn--active={activeMode === m.id}
						onclick={() => { activeMode = m.id; submitError = ""; attachments = []; }}
					>
						<m.icon size={20} strokeWidth={1.8} />
						<span class="ap__mode-label">{m.label}</span>
					</button>
				{/each}
			</div>

			<!-- Mode hint -->
			<p class="ap__mode-hint">
				{modes.find(m => m.id === activeMode)?.hint}
			</p>

			<form class="ap__form" onsubmit={handleSubmit}>

				<!-- ======================================================
				     MEDIA SECTION — foto/video modes only
				     ====================================================== -->
				{#if activeMode === "foto" || activeMode === "video"}
				<section class="ap__section">
					<h2 class="ap__section-title">
						<span class="ap__step">1</span>
						{#if activeMode === "foto"}Fotos &amp; Videos *
						{:else}Videos &amp; Fotos *
						{/if}
					</h2>
					<p class="ap__hint">
						{#if activeMode === "video"}
							Videos für präzise 3D-Analyse — langsam gehen, gute Beleuchtung. Fotos willkommen.
						{:else}
							Jeden Raum aus einer Ecke fotografieren. Videos sind ebenfalls willkommen.
						{/if}
						Jedes Format akzeptiert, beliebig viele Dateien.
					</p>

					<MediaDropzone
						variant="public"
						accept="image/*,video/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.bmp,.tiff,.tif,.avif,.mp4,.mov,.mpeg,.mpg,.avi,.webm,.mkv,.3gp,.m4v"
						label="Dateien hinzufügen"
						hint="Klicken oder hierher ziehen — jedes Format, beliebig viele"
						hasFiles={attachments.length > 0}
						id="foto-angebot-files"
						onfiles={(files) => { attachments = [...attachments, ...files]; }}
					>
						<MediaPreviewGrid
							files={attachments}
							mode="mixed"
							variant="public"
							dropzoneId="foto-angebot-files"
							onremove={(i) => { attachments = attachments.filter((_, idx) => idx !== i); }}
						/>
					</MediaDropzone>

					{#if attachments.length > 0}
						<p class="ap__count">{attachments.length} {attachments.length === 1 ? "Datei" : "Dateien"} ausgewählt</p>
					{/if}
				</section>
				{/if}

				<!-- ======================================================
				     TERMIN — appointment details
				     ====================================================== -->
				{#if activeMode === "termin"}
					<section class="ap__section">
						<h2 class="ap__section-title">
							<span class="ap__step">2</span>
							Terminwunsch
						</h2>
						<div class="ap__grid">
							<div class="ap__field">
								<label for="termin-date">Gewünschter Besichtigungstermin</label>
								<input type="date" id="termin-date" bind:value={formData.date} />
							</div>
							<div class="ap__field">
								<label for="termin-msg">Nachricht (optional)</label>
								<textarea id="termin-msg" bind:value={formData.message} rows={3}
									placeholder="Erreichbarkeit, Besonderheiten..."></textarea>
							</div>
						</div>
					</section>

					<section class="ap__section">
						<h2 class="ap__section-title">
							<span class="ap__step">3</span>
							Adressen {attachments.length > 0 ? "*" : "(optional)"}
						</h2>
						{#if attachments.length === 0}
							<p class="ap__hint">Hilft uns, den richtigen Mitarbeiter zu schicken.</p>
						{/if}
						{@render addressBlock()}
					</section>
				{/if}

				<!-- ======================================================
				     MANUELL — addresses required
				     ====================================================== -->
				{#if activeMode === "manuell"}
					<section class="ap__section">
						<h2 class="ap__section-title">
							<span class="ap__step">2</span>
							Umzugsdetails
						</h2>
						{@render addressBlock()}
					</section>

					<section class="ap__section">
						<h2 class="ap__section-title">
							<span class="ap__step">3</span>
							Zusatzleistungen (optional)
						</h2>
						{@render servicesBlock()}
					</section>
				{/if}

				<!-- ======================================================
				     FOTO / VIDEO — addresses + services
				     ====================================================== -->
				{#if activeMode === "foto" || activeMode === "video"}
					<section class="ap__section">
						<h2 class="ap__section-title">
							<span class="ap__step">2</span>
							Umzugsdetails
						</h2>
						{@render addressBlock()}
					</section>

					<section class="ap__section">
						<h2 class="ap__section-title">
							<span class="ap__step">3</span>
							Zusatzleistungen (optional)
						</h2>
						{@render servicesBlock()}
					</section>
				{/if}

				<!-- ======================================================
				     CONTACT — always last
				     ====================================================== -->
				<section class="ap__section">
					<h2 class="ap__section-title">
						<span class="ap__step">4</span>
						Ihre Kontaktdaten
					</h2>
					<div class="ap__grid">
						<div class="ap__field ap__field--full">
							<label>Anrede</label>
							<div class="ap__radio-group">
								<label class="ap__radio">
									<input type="radio" name="salutation" value="Herr" bind:group={formData.salutation} />
									<span>Herr</span>
								</label>
								<label class="ap__radio">
									<input type="radio" name="salutation" value="Frau" bind:group={formData.salutation} />
									<span>Frau</span>
								</label>
								<label class="ap__radio">
									<input type="radio" name="salutation" value="D" bind:group={formData.salutation} />
									<span>Divers</span>
								</label>
							</div>
						</div>
						<div class="ap__field">
							<label for="first_name">Vorname</label>
							<input type="text" id="first_name" bind:value={formData.first_name} placeholder="Max" />
						</div>
						<div class="ap__field">
							<label for="last_name">Nachname *</label>
							<input type="text" id="last_name" bind:value={formData.last_name} placeholder="Mustermann" required />
						</div>
						<div class="ap__field">
							<label for="email">E-Mail-Adresse *</label>
							<input type="email" id="email" bind:value={formData.email} placeholder="max@beispiel.de" required />
						</div>
						<div class="ap__field">
							<label for="phone">Telefonnummer</label>
							<input type="tel" id="phone" bind:value={formData.phone} placeholder="05121 1234567" />
						</div>
						{#if activeMode !== "termin"}
							<div class="ap__field">
								<label for="date">Wunschtermin Umzug</label>
								<input type="date" id="date" bind:value={formData.date} />
							</div>
						{/if}
					</div>
					<div class="ap__field" style="margin-top: var(--space-4);">
						<label for="message">Nachricht (optional)</label>
						<textarea id="message" bind:value={formData.message} rows={3}
							placeholder="Klavier, Tresor, enge Treppenhäuser..."></textarea>
					</div>
				</section>

				<!-- Privacy & Submit -->
				<section class="ap__section ap__section--submit">
					<label class="ap__privacy">
						<input type="checkbox" bind:checked={formData.privacyAccepted} required />
						<span class="ap__privacy-text">
							Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Anfrage verarbeitet werden.
							Die <a href="/datenschutz" target="_blank">Datenschutzerklärung</a> habe ich zur Kenntnis genommen.
						</span>
					</label>

					{#if submitError}
						<p class="ap__error">{submitError}</p>
					{/if}

					<button type="submit" class="ap__btn" disabled={!isFormValid || isSubmitting}>
						{#if isSubmitting}
							<span class="ap__spinner"></span>
							<span>Wird gesendet...</span>
						{:else}
							<Send size={20} />
							<span>
								{activeMode === "termin"  ? "Terminanfrage senden" :
								 activeMode === "manuell" ? "Angebot anfordern"    :
								 activeMode === "foto"    ? "Dateien einreichen"   :
								                           "Dateien einreichen"}
							</span>
						{/if}
					</button>
				</section>
			</form>
		{/if}
	</div>
</main>

<!-- ======================================================
     Shared snippets
     ====================================================== -->
{#snippet addressBlock()}
	<div class="ap__grid">
		<div class="ap__field">
			<label>Auszugsadresse *</label>
			<div class="ap__addr-row">
				<input type="text" bind:value={formData.startStrasse} placeholder="Straße"
					required={activeMode !== "termin"} aria-label="Straße (Auszug)" />
				<input class="ap__addr-nr" type="text" bind:value={formData.startHausnummer} placeholder="Nr."
					required={activeMode !== "termin"} aria-label="Hausnummer (Auszug)" />
			</div>
			<div class="ap__addr-row">
				<input class="ap__addr-plz" type="text" bind:value={formData.startPlz} placeholder="PLZ"
					pattern={"[0-9]{5}"} inputmode="numeric" maxlength="5"
					required={activeMode !== "termin"} aria-label="PLZ (Auszug)" />
				<input type="text" bind:value={formData.startOrt} placeholder="Ort"
					required={activeMode !== "termin"} aria-label="Ort (Auszug)" />
			</div>
		</div>

		<div class="ap__field">
			<label for="startFloor">Etage Auszug</label>
			<select id="startFloor" bind:value={formData.startFloor}>
				{#each floorOptions as o}<option value={o.value}>{o.label}</option>{/each}
			</select>
		</div>

		<div class="ap__field ap__field--full ap__field--checks">
			<label class="ap__check">
				<input type="checkbox" bind:checked={formData.aufzugAuszug} />
				<span>Aufzug vorhanden</span>
			</label>
			<label class="ap__check">
				<input type="checkbox" bind:checked={formData.halteverbotAuszug} />
				<span>Halteverbot benötigt</span>
			</label>
		</div>

		<div class="ap__field">
			<label>Einzugsadresse *</label>
			<div class="ap__addr-row">
				<input type="text" bind:value={formData.endStrasse} placeholder="Straße"
					required={activeMode !== "termin"} aria-label="Straße (Einzug)" />
				<input class="ap__addr-nr" type="text" bind:value={formData.endHausnummer} placeholder="Nr."
					required={activeMode !== "termin"} aria-label="Hausnummer (Einzug)" />
			</div>
			<div class="ap__addr-row">
				<input class="ap__addr-plz" type="text" bind:value={formData.endPlz} placeholder="PLZ"
					pattern={"[0-9]{5}"} inputmode="numeric" maxlength="5"
					required={activeMode !== "termin"} aria-label="PLZ (Einzug)" />
				<input type="text" bind:value={formData.endOrt} placeholder="Ort"
					required={activeMode !== "termin"} aria-label="Ort (Einzug)" />
			</div>
		</div>

		<div class="ap__field">
			<label for="endFloor">Etage Einzug</label>
			<select id="endFloor" bind:value={formData.endFloor}>
				{#each floorOptions as o}<option value={o.value}>{o.label}</option>{/each}
			</select>
		</div>

		<div class="ap__field ap__field--full ap__field--checks">
			<label class="ap__check">
				<input type="checkbox" bind:checked={formData.aufzugEinzug} />
				<span>Aufzug vorhanden</span>
			</label>
			<label class="ap__check">
				<input type="checkbox" bind:checked={formData.halteverbotEinzug} />
				<span>Halteverbot benötigt</span>
			</label>
		</div>
	</div>
{/snippet}

{#snippet servicesBlock()}
	<div class="ap__services">
		{#each additionalServices as s}
			<label class="ap__service">
				<input type="checkbox" checked={formData.selectedServices.includes(s.id)} onchange={() => toggleService(s.id)} />
				<span class="ap__service-box"></span>
				<span class="ap__service-label">{s.label}</span>
			</label>
		{/each}
	</div>
{/snippet}

<style>
	/* ===== Page ===== */
	.ap {
		background-color: #f4f6f8;
		min-height: 60vh;
		padding-block: var(--space-12);
	}
	.ap__container {
		max-width: 900px;
		margin-inline: auto;
		padding-inline: var(--container-padding);
	}
	.ap__header {
		text-align: center;
		margin-bottom: var(--space-8);
	}
	.ap__heading {
		color: var(--color-info-bar);
		font-size: clamp(var(--text-2xl), 4vw, var(--text-4xl));
		font-weight: var(--font-bold);
		margin: 0 0 var(--space-3);
	}
	.ap__subheading {
		color: #4a5568;
		font-size: var(--text-lg);
		line-height: 1.6;
		margin: 0;
		max-width: 600px;
		margin-inline: auto;
	}

	/* ===== Mode selector ===== */
	.ap__mode-selector {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}
	.ap__mode-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-2);
		background-color: var(--color-text);
		border: 2px solid #e2e8f0;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-fast);
		color: #64748b;
	}
	.ap__mode-btn:hover {
		border-color: var(--color-nav-accent);
		color: var(--color-nav-accent);
	}
	.ap__mode-btn--active {
		border-color: var(--color-nav-accent);
		background-color: rgba(196, 65, 0, 0.06);
		color: var(--color-nav-accent);
	}
	.ap__mode-label {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
	}
	.ap__mode-hint {
		text-align: center;
		color: #64748b;
		font-size: var(--text-sm);
		margin: 0 0 var(--space-6);
	}

	/* ===== Form ===== */
	.ap__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	/* ===== Sections ===== */
	.ap__section {
		background-color: var(--color-text);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		box-shadow: var(--shadow-md);
	}
	.ap__section-title {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		color: var(--color-info-bar);
		font-size: var(--text-lg);
		font-weight: var(--font-bold);
		margin: 0 0 var(--space-5);
	}
	.ap__step {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: var(--color-nav-accent);
		color: var(--color-text);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: var(--font-bold);
		flex-shrink: 0;
	}
	.ap__step-optional {
		font-size: var(--text-sm);
		font-weight: var(--font-normal);
		color: #94a3b8;
		margin-left: var(--space-1);
	}
	.ap__hint {
		color: #64748b;
		font-size: var(--text-sm);
		line-height: 1.6;
		margin: calc(-1 * var(--space-3)) 0 var(--space-4);
	}
	.ap__warn {
		color: #b45309;
		font-size: var(--text-sm);
		margin-top: var(--space-2);
		background: #fef3c7;
		border: 1px solid #fcd34d;
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
	}

	/* ===== Grid / Fields ===== */
	.ap__grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}
	.ap__field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.ap__field--full { grid-column: 1 / -1; }
	.ap__radio-group {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}
	.ap__radio {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
		font-size: var(--text-base);
		color: #2d3748;
	}
	.ap__radio input[type="radio"] {
		width: 1.1rem;
		height: 1.1rem;
		accent-color: var(--color-nav-accent);
		cursor: pointer;
	}
	.ap__field--checks {
		flex-direction: row;
		gap: var(--space-3);
		flex-wrap: wrap;
	}
	.ap__field label {
		color: #4a5568;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}
	.ap__field input,
	.ap__field textarea,
	.ap__field select {
		padding: var(--space-3) var(--space-4);
		border: 1.5px solid #e2e8f0;
		border-radius: var(--radius-md);
		font-size: var(--text-base);
		background-color: #f8fafc;
		transition: all var(--transition-fast);
		font-family: inherit;
	}
	.ap__field select {
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: var(--space-10);
	}
	.ap__field input:focus,
	.ap__field textarea:focus,
	.ap__field select:focus {
		border-color: var(--color-nav-accent);
		background-color: var(--color-text);
		outline: none;
		box-shadow: 0 0 0 3px rgba(196, 65, 0, 0.1);
	}
	.ap__field textarea { resize: vertical; min-height: 80px; }

	/* ===== Address sub-rows ===== */
	.ap__addr-row { display: flex; gap: var(--space-2); flex-wrap: wrap; }
	.ap__addr-row input { flex: 1; min-width: 0; }
	input.ap__addr-nr  { flex: 0 0 80px;  max-width: 80px; }
	input.ap__addr-plz { flex: 0 0 100px; max-width: 100px; }

	/* ===== Checkbox rows ===== */
	.ap__check {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background-color: #f8fafc;
		border: 1.5px solid #e2e8f0;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.ap__check:hover { background-color: #edf2f7; }
	.ap__check input[type="checkbox"] { cursor: pointer; width: 18px; height: 18px; }
	.ap__check span { color: #4a5568; font-size: var(--text-sm); font-weight: var(--font-medium); }

	/* ===== Services grid ===== */
	.ap__services {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
	}
	.ap__service {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background-color: #f8fafc;
		border: 1.5px solid #e2e8f0;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.ap__service:hover { background-color: #edf2f7; }
	.ap__service input { display: none; }
	.ap__service-box {
		width: 20px; height: 20px;
		border: 2px solid #cbd5e0;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		flex-shrink: 0;
	}
	.ap__service input:checked + .ap__service-box {
		background-color: var(--color-nav-accent);
		border-color: var(--color-nav-accent);
	}
	.ap__service input:checked + .ap__service-box::after {
		content: "\2713";
		color: white;
		font-size: 12px;
		font-weight: bold;
	}
	.ap__service-label { color: #4a5568; font-size: var(--text-sm); }

	.ap__count { color: #64748b; font-size: var(--text-sm); margin-top: var(--space-2); }

	/* ===== Submit section ===== */
	.ap__section--submit {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		align-items: center;
	}
	.ap__privacy {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		cursor: pointer;
	}
	.ap__privacy input { margin-top: 4px; flex-shrink: 0; }
	.ap__privacy-text { color: #4a5568; font-size: var(--text-sm); line-height: 1.6; }
	.ap__privacy-text a { color: var(--color-nav-accent); text-decoration: none; }
	.ap__privacy-text a:hover { text-decoration: underline; }
	.ap__error { color: #dc2626; font-size: var(--text-sm); margin: 0; text-align: center; }

	.ap__btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		width: 100%;
		max-width: 400px;
		padding: var(--space-4) var(--space-6);
		background-color: var(--color-nav-accent);
		color: var(--color-text);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-decoration: none;
		font-family: inherit;
	}
	.ap__btn--center { margin-inline: auto; }
	.ap__btn:hover:not(:disabled) { background-color: #b83b00; transform: translateY(-2px); }
	.ap__btn:disabled { background-color: #cbd5e0; cursor: not-allowed; }

	/* ===== Success ===== */
	.ap__success {
		background-color: var(--color-text);
		border-radius: var(--radius-lg);
		padding: var(--space-12) var(--space-10);
		box-shadow: var(--shadow-md);
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}
	.ap__success-icon {
		width: 64px; height: 64px;
		background-color: var(--color-nav-accent);
		color: white;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28px;
		font-weight: bold;
	}
	.ap__success h2 { color: var(--color-info-bar); margin: 0; }
	.ap__success p  { color: #4a5568; margin: 0; max-width: 480px; }

	/* ===== Spinner ===== */
	.ap__spinner {
		width: 18px; height: 18px;
		border: 2px solid rgba(255,255,255,0.4);
		border-top-color: white;
		border-radius: var(--radius-full);
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* ===== Responsive ===== */
	@media (max-width: 767px) {
		.ap { padding-block: var(--space-8); }
		.ap__mode-selector { grid-template-columns: repeat(2, 1fr); }
		.ap__mode-btn { min-height: 64px; }
		.ap__grid { grid-template-columns: 1fr; }
		.ap__services { grid-template-columns: repeat(2, 1fr); }
		.ap__section { padding: var(--space-4); }
		.ap__field--checks { flex-direction: column; }
		.ap__check { min-height: 44px; }
	}
	@media (max-width: 480px) {
		.ap__services { grid-template-columns: 1fr; }
		.ap__mode-label { font-size: var(--text-xs); }
		.ap__addr-row { flex-direction: column; }
		input.ap__addr-nr,
		input.ap__addr-plz {
			flex: 1 1 auto;
			max-width: 100%;
		}
	}
</style>
