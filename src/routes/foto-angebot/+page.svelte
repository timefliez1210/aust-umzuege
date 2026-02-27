<script lang="ts">
	import { Send, Camera, X, ImagePlus } from "lucide-svelte";

	const API_URL = import.meta.env.VITE_PHOTO_API_URL || "https://api.aufraeumhelden.com/api/v1/inquiries/photo";

	// Floor options (matching API spec)
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
		{ id: "Möbelmontage", label: "Möbelmontage" },
		{ id: "Einpackservice", label: "Einpackservice" },
		{ id: "Einlagerung", label: "Einlagerung" },
		{ id: "Entsorgung", label: "Entsorgung" },
	];

	// Form state
	let formData = $state({
		name: "",
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

	let images = $state<File[]>([]);
	let imagePreviews = $state<string[]>([]);
	let isDragging = $state(false);
	let isSubmitting = $state(false);
	let submitSuccess = $state(false);
	let submitError = $state("");
	let fileInput = $state<HTMLInputElement>(null!);

	const isFormValid = $derived(
		formData.name !== "" &&
		formData.email !== "" &&
		formData.startStrasse !== "" &&
		formData.startHausnummer !== "" &&
		formData.startPlz !== "" &&
		formData.startOrt !== "" &&
		formData.endStrasse !== "" &&
		formData.endHausnummer !== "" &&
		formData.endPlz !== "" &&
		formData.endOrt !== "" &&
		images.length > 0 &&
		formData.privacyAccepted,
	);

	function toggleService(serviceId: string) {
		if (formData.selectedServices.includes(serviceId)) {
			formData.selectedServices = formData.selectedServices.filter(s => s !== serviceId);
		} else {
			formData.selectedServices = [...formData.selectedServices, serviceId];
		}
	}

	function addFiles(files: FileList | File[]) {
		const fileArray = Array.from(files);
		const validFiles = fileArray.filter(f => {
			if (!f.type.startsWith("image/")) return false;
			if (f.size > 10 * 1024 * 1024) {
				submitError = `"${f.name}" ist zu groß (max. 10 MB).`;
				return false;
			}
			return true;
		});

		for (const file of validFiles) {
			images = [...images, file];
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreviews = [...imagePreviews, e.target?.result as string];
			};
			reader.readAsDataURL(file);
		}
	}

	function removeImage(index: number) {
		images = images.filter((_, i) => i !== index);
		imagePreviews = imagePreviews.filter((_, i) => i !== index);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) {
			addFiles(e.dataTransfer.files);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			addFiles(input.files);
			input.value = "";
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!isFormValid || isSubmitting) return;

		isSubmitting = true;
		submitError = "";

		const fd = new FormData();
		fd.append("name", formData.name);
		fd.append("email", formData.email);
		if (formData.phone) fd.append("phone", formData.phone);
		if (formData.date) fd.append("wunschtermin", formData.date);
		fd.append("auszugsadresse", `${formData.startStrasse} ${formData.startHausnummer}, ${formData.startPlz} ${formData.startOrt}`);
		if (formData.startFloor) fd.append("etage_auszug", formData.startFloor);
		fd.append("aufzug_auszug", formData.aufzugAuszug ? "true" : "false");
		fd.append("halteverbot_auszug", formData.halteverbotAuszug ? "true" : "false");
		fd.append("einzugsadresse", `${formData.endStrasse} ${formData.endHausnummer}, ${formData.endPlz} ${formData.endOrt}`);
		if (formData.endFloor) fd.append("etage_einzug", formData.endFloor);
		fd.append("aufzug_einzug", formData.aufzugEinzug ? "true" : "false");
		fd.append("halteverbot_einzug", formData.halteverbotEinzug ? "true" : "false");
		if (formData.selectedServices.length > 0) {
			fd.append("zusatzleistungen", formData.selectedServices.join(", "));
		}
		if (formData.message) fd.append("nachricht", formData.message);

		for (const img of images) {
			fd.append("images", img);
		}

		try {
			const response = await fetch(API_URL, {
				method: "POST",
				body: fd,
			});

			if (response.ok || response.status === 202) {
				submitSuccess = true;
			} else {
				const data = await response.json().catch(() => null);
				submitError = data?.message || data?.detail || `Fehler (${response.status}). Bitte versuchen Sie es erneut.`;
			}
		} catch (err) {
			console.error("Fetch error:", err);
			submitError = "Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.";
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Foto-Angebot | Aust Umzüge</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="angebot-page">
	<div class="angebot-page__container">
		<header class="angebot-page__header">
			<h1 class="angebot-page__heading">Angebot mit Fotos anfordern</h1>
			<p class="angebot-page__subheading">
				Fotografieren Sie Ihre Räume und erhalten Sie ein präzises, kostenloses Angebot.
				Unsere KI analysiert Ihre Fotos und erstellt automatisch eine Volumenberechnung.
			</p>
		</header>

		{#if submitSuccess}
			<div class="angebot-page__success">
				<h2>Vielen Dank für Ihre Anfrage!</h2>
				<p>Wir analysieren Ihre Fotos und senden Ihnen in Kürze ein individuelles Angebot per E-Mail.</p>
				<a href="/" class="angebot-page__submit angebot-page__submit--centered">
					Zur Startseite
				</a>
			</div>
		{:else}
			<form
				class="angebot-page__form"
				onsubmit={handleSubmit}
				toolname="foto-angebot"
				tooldescription="Umzugsangebot mit Fotos anfordern. Raumfotos hochladen, Auszugs-/Einzugsadresse mit Etage angeben und Kontaktdaten hinterlassen für eine KI-basierte Volumenberechnung."
			>
				<!-- Step 1: Photos -->
				<section class="angebot-page__section">
					<h2 class="angebot-page__section-title">
						<span class="angebot-page__step-number">1</span>
						Fotos Ihrer Räume *
					</h2>
					<p class="angebot-page__section-hint">
						Fotografieren Sie jeden Raum möglichst aus einer Ecke, um den gesamten Inhalt zu erfassen.
						1–3 Fotos pro Raum sind ideal. JPEG oder PNG, max. 10 MB pro Bild.
					</p>

					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="photo-upload"
						class:photo-upload--dragging={isDragging}
						ondrop={handleDrop}
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
					>
						{#if images.length === 0}
							<button type="button" class="photo-upload__empty" onclick={() => fileInput.click()}>
								<Camera size={48} strokeWidth={1.5} />
								<span class="photo-upload__empty-title">Fotos hinzufügen</span>
								<span class="photo-upload__empty-hint">Klicken oder Bilder hierher ziehen</span>
							</button>
						{:else}
							<div class="photo-upload__grid">
								{#each imagePreviews as preview, i}
									<div class="photo-upload__thumb">
										<img src={preview} alt="Raum {i + 1}" />
										<button
											type="button"
											class="photo-upload__remove"
											onclick={() => removeImage(i)}
											aria-label="Bild entfernen"
										>
											<X size={14} />
										</button>
										<span class="photo-upload__filename">{images[i].name}</span>
									</div>
								{/each}
								<button type="button" class="photo-upload__add" onclick={() => fileInput.click()}>
									<ImagePlus size={24} />
									<span>Weitere</span>
								</button>
							</div>
						{/if}
					</div>

					<input
						bind:this={fileInput}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						multiple
						class="hidden"
						onchange={handleFileSelect}
					/>

					{#if images.length > 0}
						<p class="photo-upload__count">{images.length} {images.length === 1 ? "Foto" : "Fotos"} ausgewählt</p>
					{/if}
				</section>

				<!-- Step 2: Addresses -->
				<section class="angebot-page__section">
					<h2 class="angebot-page__section-title">
						<span class="angebot-page__step-number">2</span>
						Umzugsdetails
					</h2>

					<div class="angebot-page__form-grid">
						<div class="angebot-page__form-group">
							<label>Auszugsadresse *</label>
						<div class="angebot-page__address-row">
							<input type="text" bind:value={formData.startStrasse} placeholder="Straße" required aria-label="Straße (Auszug)" />
							<input class="angebot-page__address-nr" type="text" bind:value={formData.startHausnummer} placeholder="Nr." required aria-label="Hausnummer (Auszug)" />
						</div>
						<div class="angebot-page__address-row">
							<input class="angebot-page__address-plz" type="text" bind:value={formData.startPlz} placeholder="PLZ" required pattern={"[0-9]{5}"} inputmode="numeric" maxlength="5" aria-label="Postleitzahl (Auszug)" />
							<input type="text" bind:value={formData.startOrt} placeholder="Ort" required aria-label="Ort (Auszug)" />
						</div>
						</div>

						<div class="angebot-page__form-group">
							<label for="startFloor">Etage Auszug</label>
							<select id="startFloor" bind:value={formData.startFloor}
							toolparamtitle="Etage Auszug"
							toolparamdescription="Stockwerk der Auszugsadresse"
						>
								{#each floorOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>

						<div class="angebot-page__form-group angebot-page__form-group--full angebot-page__form-group--checks">
							<label class="angebot-page__checkbox-label">
								<input type="checkbox" bind:checked={formData.aufzugAuszug} />
								<span>Aufzug vorhanden</span>
							</label>
							<label class="angebot-page__checkbox-label">
								<input type="checkbox" bind:checked={formData.halteverbotAuszug} />
								<span>Halteverbot benötigt</span>
							</label>
						</div>

						<div class="angebot-page__form-group">
							<label>Einzugsadresse *</label>
						<div class="angebot-page__address-row">
							<input type="text" bind:value={formData.endStrasse} placeholder="Straße" required aria-label="Straße (Einzug)" />
							<input class="angebot-page__address-nr" type="text" bind:value={formData.endHausnummer} placeholder="Nr." required aria-label="Hausnummer (Einzug)" />
						</div>
						<div class="angebot-page__address-row">
							<input class="angebot-page__address-plz" type="text" bind:value={formData.endPlz} placeholder="PLZ" required pattern={"[0-9]{5}"} inputmode="numeric" maxlength="5" aria-label="Postleitzahl (Einzug)" />
							<input type="text" bind:value={formData.endOrt} placeholder="Ort" required aria-label="Ort (Einzug)" />
						</div>
						</div>

						<div class="angebot-page__form-group">
							<label for="endFloor">Etage Einzug</label>
							<select id="endFloor" bind:value={formData.endFloor}
							toolparamtitle="Etage Einzug"
							toolparamdescription="Stockwerk der Einzugsadresse"
						>
								{#each floorOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>

						<div class="angebot-page__form-group angebot-page__form-group--full angebot-page__form-group--checks">
							<label class="angebot-page__checkbox-label">
								<input type="checkbox" bind:checked={formData.aufzugEinzug} />
								<span>Aufzug vorhanden</span>
							</label>
							<label class="angebot-page__checkbox-label">
								<input type="checkbox" bind:checked={formData.halteverbotEinzug} />
								<span>Halteverbot benötigt</span>
							</label>
						</div>

						<div class="angebot-page__form-group">
							<label for="date">Wunschtermin</label>
							<input
								type="date"
								id="date"
								bind:value={formData.date}
								toolparamtitle="Wunschtermin"
								toolparamdescription="Gewünschtes Umzugsdatum (optional)"
							/>
						</div>
					</div>
				</section>

				<!-- Step 3: Additional Services -->
				<section class="angebot-page__section">
					<h2 class="angebot-page__section-title">
						<span class="angebot-page__step-number">3</span>
						Zusatzleistungen (optional)
					</h2>

					<div class="angebot-page__services-grid">
						{#each additionalServices as service}
							<label class="angebot-page__service-option">
								<input
									type="checkbox"
									checked={formData.selectedServices.includes(service.id)}
									onchange={() => toggleService(service.id)}
								/>
								<span class="angebot-page__service-checkbox"></span>
								<span class="angebot-page__service-label">{service.label}</span>
							</label>
						{/each}
					</div>
				</section>

				<!-- Step 4: Contact + Message -->
				<section class="angebot-page__section">
					<h2 class="angebot-page__section-title">
						<span class="angebot-page__step-number">4</span>
						Ihre Kontaktdaten
					</h2>

					<div class="angebot-page__form-grid">
						<div class="angebot-page__form-group">
							<label for="name">Ihr Name *</label>
							<input
								type="text"
								id="name"
								bind:value={formData.name}
								placeholder="Max Mustermann"
								required
								toolparamtitle="Name"
								toolparamdescription="Vollständiger Name des Kunden"
							/>
						</div>

						<div class="angebot-page__form-group">
							<label for="email">E-Mail-Adresse *</label>
							<input
								type="email"
								id="email"
								bind:value={formData.email}
								placeholder="max@beispiel.de"
								required
								toolparamtitle="E-Mail"
								toolparamdescription="E-Mail-Adresse des Kunden"
							/>
						</div>

						<div class="angebot-page__form-group">
							<label for="phone">Telefonnummer</label>
							<input
								type="tel"
								id="phone"
								bind:value={formData.phone}
								placeholder="05121 1234567"
								toolparamtitle="Telefon"
								toolparamdescription="Telefonnummer des Kunden (optional)"
							/>
						</div>
					</div>

					<div class="angebot-page__form-group" style="margin-top: var(--space-4);">
						<label for="message">Nachricht (optional)</label>
						<textarea
							id="message"
							bind:value={formData.message}
							placeholder="Besonderheiten wie Klavier, Tresor, enge Treppenhäuser..."
							rows={3}
							toolparamtitle="Nachricht"
							toolparamdescription="Besonderheiten oder zusätzliche Informationen zum Umzug (optional)"
						></textarea>
					</div>
				</section>

				<!-- Privacy & Submit -->
				<section class="angebot-page__section angebot-page__section--submit">
					<label class="angebot-page__privacy">
						<input
							type="checkbox"
							bind:checked={formData.privacyAccepted}
							required
						/>
						<span class="angebot-page__privacy-text">
							Ich stimme zu, dass meine Angaben und Fotos zur Bearbeitung meiner
							Anfrage erhoben und verarbeitet werden. Die <a
								href="/datenschutz"
								target="_blank">Datenschutzerklärung</a
							> habe ich zur Kenntnis genommen.
						</span>
					</label>

					{#if submitError}
						<p class="angebot-page__error">{submitError}</p>
					{/if}

					<button
						type="submit"
						class="angebot-page__submit"
						disabled={!isFormValid || isSubmitting}
					>
						{#if isSubmitting}
							<span>Wird gesendet...</span>
						{:else}
							<Send size={20} />
							<span>Kostenloses Angebot anfordern</span>
						{/if}
					</button>
				</section>
			</form>
		{/if}
	</div>
</main>

<style>
	.hidden {
		display: none;
	}

	/* ===== Page Layout (matches kostenloses-angebot) ===== */
	.angebot-page {
		background-color: #f4f6f8;
		min-height: 60vh;
		padding-block: var(--space-12);
	}

	.angebot-page__container {
		max-width: 900px;
		margin-inline: auto;
		padding-inline: var(--container-padding);
	}

	.angebot-page__header {
		text-align: center;
		margin-bottom: var(--space-10);
	}

	.angebot-page__heading {
		color: var(--color-info-bar);
		font-size: clamp(var(--text-2xl), 4vw, var(--text-4xl));
		font-weight: var(--font-bold);
		margin: 0 0 var(--space-4);
	}

	.angebot-page__subheading {
		color: #4a5568;
		font-size: var(--text-lg);
		line-height: 1.6;
		margin: 0;
		max-width: 600px;
		margin-inline: auto;
	}

	/* ===== Success ===== */
	.angebot-page__success {
		background-color: var(--color-text);
		border-radius: var(--radius-lg);
		padding: var(--space-10);
		box-shadow: var(--shadow-md);
		text-align: center;
	}

	.angebot-page__success h2 {
		color: var(--color-info-bar);
		margin: 0 0 var(--space-4);
	}

	.angebot-page__success p {
		color: #4a5568;
		margin: 0 0 var(--space-6);
	}

	.angebot-page__error {
		color: #dc2626;
		font-size: var(--text-sm);
		margin: 0;
		text-align: center;
	}

	/* ===== Form ===== */
	.angebot-page__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	/* ===== Sections ===== */
	.angebot-page__section {
		background-color: var(--color-text);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		box-shadow: var(--shadow-md);
	}

	.angebot-page__section-title {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		color: var(--color-info-bar);
		font-size: var(--text-lg);
		font-weight: var(--font-bold);
		margin: 0 0 var(--space-5);
	}

	.angebot-page__section-hint {
		color: #64748b;
		font-size: var(--text-sm);
		line-height: 1.6;
		margin: calc(-1 * var(--space-3)) 0 var(--space-4);
	}

	.angebot-page__step-number {
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

	/* ===== Form Grid ===== */
	.angebot-page__form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}

	.angebot-page__form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.angebot-page__form-group--full {
		grid-column: 1 / -1;
	}

	.angebot-page__form-group--checks {
		flex-direction: row;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.angebot-page__form-group label {
		color: #4a5568;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.angebot-page__form-group input,
	.angebot-page__form-group textarea,
	.angebot-page__form-group select {
		padding: var(--space-3) var(--space-4);
		border: 1.5px solid #e2e8f0;
		border-radius: var(--radius-md);
		font-size: var(--text-base);
		background-color: #f8fafc;
		transition: all var(--transition-fast);
	}

	.angebot-page__form-group select {
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: var(--space-10);
	}

	.angebot-page__form-group input:focus,
	.angebot-page__form-group textarea:focus,
	.angebot-page__form-group select:focus {
		border-color: var(--color-nav-accent);
		background-color: var(--color-text);
		outline: none;
		box-shadow: 0 0 0 3px rgba(230, 81, 0, 0.1);
	}

	.angebot-page__form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	/* ===== Checkbox Labels ===== */
	.angebot-page__checkbox-label {
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

	.angebot-page__checkbox-label:hover {
		background-color: #edf2f7;
	}

	.angebot-page__checkbox-label input[type="checkbox"] {
		cursor: pointer;
		width: 18px;
		height: 18px;
	}

	.angebot-page__checkbox-label span {
		color: #4a5568;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	/* ===== Services Grid ===== */
	.angebot-page__services-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
	}

	.angebot-page__service-option {
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

	.angebot-page__service-option:hover {
		background-color: #edf2f7;
	}

	.angebot-page__service-option input {
		display: none;
	}

	.angebot-page__service-checkbox {
		width: 20px;
		height: 20px;
		border: 2px solid #cbd5e0;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		flex-shrink: 0;
	}

	.angebot-page__service-option input:checked + .angebot-page__service-checkbox {
		background-color: var(--color-nav-accent);
		border-color: var(--color-nav-accent);
	}

	.angebot-page__service-option input:checked + .angebot-page__service-checkbox::after {
		content: "\2713";
		color: white;
		font-size: 12px;
		font-weight: bold;
	}

	.angebot-page__service-label {
		color: #4a5568;
		font-size: var(--text-sm);
	}

	/* ===== Photo Upload ===== */
	.photo-upload {
		border: 2px dashed #cbd5e0;
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
		background-color: #f8fafc;
	}

	.photo-upload--dragging {
		border-color: var(--color-nav-accent);
		background-color: rgba(230, 81, 0, 0.05);
	}

	.photo-upload__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-10) var(--space-6);
		width: 100%;
		cursor: pointer;
		color: #94a3b8;
		background: none;
		border: none;
	}

	.photo-upload__empty:hover {
		color: var(--color-nav-accent);
	}

	.photo-upload__empty-title {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: #475569;
	}

	.photo-upload__empty-hint {
		font-size: var(--text-sm);
		color: #94a3b8;
	}

	.photo-upload__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: var(--space-3);
		padding: var(--space-4);
	}

	.photo-upload__thumb {
		position: relative;
		aspect-ratio: 1;
		border-radius: var(--radius-md);
		overflow: hidden;
		background-color: #e2e8f0;
	}

	.photo-upload__thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.photo-upload__remove {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 24px;
		height: 24px;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.photo-upload__remove:hover {
		background-color: #dc2626;
	}

	.photo-upload__filename {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
		color: white;
		font-size: 10px;
		padding: 12px 6px 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.photo-upload__add {
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		border: 2px dashed #cbd5e0;
		border-radius: var(--radius-md);
		background: none;
		color: #94a3b8;
		cursor: pointer;
		font-size: var(--text-xs);
		transition: all var(--transition-fast);
	}

	.photo-upload__add:hover {
		border-color: var(--color-nav-accent);
		color: var(--color-nav-accent);
	}

	.photo-upload__count {
		color: #64748b;
		font-size: var(--text-sm);
		margin-top: var(--space-2);
	}

	/* ===== Privacy & Submit ===== */
	.angebot-page__section--submit {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		align-items: center;
	}

	.angebot-page__privacy {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		cursor: pointer;
	}

	.angebot-page__privacy input {
		margin-top: 4px;
		flex-shrink: 0;
	}

	.angebot-page__privacy-text {
		color: #4a5568;
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	.angebot-page__privacy-text a {
		color: var(--color-nav-accent);
		text-decoration: none;
	}

	.angebot-page__privacy-text a:hover {
		text-decoration: underline;
	}

	.angebot-page__submit {
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
	}

	.angebot-page__submit--centered {
		margin-inline: auto;
	}

	.angebot-page__submit:hover:not(:disabled) {
		background-color: #d84a00;
		transform: translateY(-2px);
	}

	.angebot-page__submit:disabled {
		background-color: #cbd5e0;
		cursor: not-allowed;
	}

	/* ===== Address sub-fields ===== */
	.angebot-page__address-row {
		display: flex;
		gap: var(--space-2);
	}

	.angebot-page__address-row input {
		flex: 1;
		min-width: 0;
	}

	input.angebot-page__address-nr {
		flex: 0 0 80px;
	}

	input.angebot-page__address-plz {
		flex: 0 0 100px;
	}

	/* ===== Responsive ===== */
	@media (max-width: 767px) {
		.angebot-page {
			padding-block: var(--space-8);
		}

		.angebot-page__form-grid {
			grid-template-columns: 1fr;
		}

		.angebot-page__services-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.angebot-page__section {
			padding: var(--space-4);
		}

		.photo-upload__grid {
			grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
		}

		.angebot-page__form-group--checks {
			flex-direction: column;
		}
	}

	@media (max-width: 480px) {
		.angebot-page__services-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
