<script lang="ts">
    import VolumeCalculator from "$lib/components/VolumeCalculator.svelte";
    import { Send } from "lucide-svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import { createBreadcrumbs } from "$lib/data/structuredData";

    // Volume calculator bindings
    let volumeM3 = $state(0);
    let itemSummary = $state("");

    // Floor options
    const floorOptions = [
        { value: "", label: "Bitte wählen *" },
        { value: "Erdgeschoss", label: "Erdgeschoss" },
        { value: "Hochparterre", label: "Hochparterre" },
        { value: "1. Stock", label: "1. Stock" },
        { value: "2. Stock", label: "2. Stock" },
        { value: "3. Stock", label: "3. Stock" },
        { value: "4. Stock", label: "4. Stock" },
        { value: "5. Stock", label: "5. Stock" },
        { value: "6. Stock", label: "6. Stock" },
        { value: "Höher", label: "Höher als 6. Stock" },
    ];

    // Form state
    let formData = $state({
        name: "",
        email: "",
        phone: "",
        startAddress: "",
        startFloor: "",
        halteverbotAuszug: false,
        hasZwischenstopp: false,
        zwischenstoppAddress: "",
        zwischenstoppFloor: "",
        halteverbotZwischenstopp: false,
        endAddress: "",
        endFloor: "",
        halteverbotEinzug: false,
        date: "",
        message: "",
        selectedServices: [] as string[],
        privacyAccepted: false,
    });

    let isSubmitting = $state(false);
    let submitSuccess = $state(false);
    let submitError = $state("");

    const additionalServices = [
        { id: "packing", label: "Einpackservice" },
        { id: "assembly", label: "Möbelmontage" },
        { id: "disassembly", label: "Möbeldemontage" },
        { id: "storage", label: "Einlagerung" },
        { id: "disposal", label: "Entsorgung Sperrmüll" },
    ];

    const isFormValid = $derived(
        formData.name !== "" &&
            formData.email !== "" &&
            formData.phone !== "" &&
            formData.startAddress !== "" &&
            formData.startFloor !== "" &&
            formData.endAddress !== "" &&
            formData.endFloor !== "" &&
            formData.date !== "" &&
            formData.privacyAccepted,
    );

    // Get selected services as comma-separated string
    const selectedServicesText = $derived(
        formData.selectedServices
            .map(id => additionalServices.find(s => s.id === id)?.label)
            .filter(Boolean)
            .join(", ") || "Keine"
    );

    function toggleService(serviceId: string) {
        if (formData.selectedServices.includes(serviceId)) {
            formData.selectedServices = formData.selectedServices.filter(
                (s) => s !== serviceId,
            );
        } else {
            formData.selectedServices = [
                ...formData.selectedServices,
                serviceId,
            ];
        }
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!isFormValid || isSubmitting) return;

        isSubmitting = true;
        submitError = "";

        const form = e.target as HTMLFormElement;
        const formDataObj = new FormData(form);

        try {
            const response = await fetch("/send-mail.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formDataObj as any).toString(),
            });

            if (response.ok) {
                submitSuccess = true;
                // Reset form
                formData = {
                    name: "",
                    email: "",
                    phone: "",
                    startAddress: "",
                    startFloor: "",
                    halteverbotAuszug: false,
                    hasZwischenstopp: false,
                    zwischenstoppAddress: "",
                    zwischenstoppFloor: "",
                    halteverbotZwischenstopp: false,
                    endAddress: "",
                    endFloor: "",
                    halteverbotEinzug: false,
                    date: "",
                    message: "",
                    selectedServices: [],
                    privacyAccepted: false,
                };
            } else {
                submitError = "Es gab einen Fehler. Bitte versuchen Sie es erneut.";
            }
        } catch (error) {
            submitError = "Es gab einen Fehler. Bitte versuchen Sie es erneut.";
        } finally {
            isSubmitting = false;
        }
    }

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Kostenloses Angebot" }
    ]);
</script>

<MetaTags
    title="Kostenloses Angebot | Aust Umzüge Hildesheim"
    description="Berechnen Sie Ihr Umzugsvolumen und erhalten Sie ein kostenloses Angebot von Aust Umzüge Hildesheim."
    keywords="Kostenloses Umzugsangebot, Umzugsrechner, Umzugskosten berechnen, Angebot Umzug Hildesheim"
    canonical="https://www.aust-umzuege.de/kostenloses-angebot"
/>

<StructuredData schema={breadcrumbs} />

<main class="angebot-page">
    <div class="angebot-page__container">
        <!-- Header Section -->
        <header class="angebot-page__header">
            <h1 class="angebot-page__heading">Kostenloses Angebot anfordern</h1>
            <p class="angebot-page__subheading">
                Nutzen Sie unseren Umzugsrechner, um das Volumen Ihres Hausrats
                zu berechnen. Füllen Sie anschließend das Formular aus, um ein
                unverbindliches Angebot zu erhalten.
            </p>
        </header>

        {#if submitSuccess}
            <div class="angebot-page__success">
                <h2>Vielen Dank für Ihre Anfrage!</h2>
                <p>Wir haben Ihre Anfrage erhalten und werden uns schnellstmöglich bei Ihnen melden.</p>
                <a href="/" class="angebot-page__submit angebot-page__submit--centered">
                    Zur Startseite
                </a>
            </div>
        {:else}
        <form
            class="angebot-page__form"
            onsubmit={handleSubmit}
            name="kostenloses-angebot"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
        >
            <!-- Netlify form detection -->
            <input type="hidden" name="form-name" value="kostenloses-angebot" />
            <p class="hidden"><label>Don't fill this out: <input name="bot-field" /></label></p>

            <!-- Hidden fields for volume calculator data -->
            <input type="hidden" name="umzugsvolumen-m3" value={volumeM3.toFixed(2)} />
            <input type="hidden" name="gegenstaende-liste" value={itemSummary} />
            <input type="hidden" name="zusatzleistungen" value={selectedServicesText} />

            <!-- Step 1: Volume Calculator -->
            <section class="angebot-page__section">
                <h2 class="angebot-page__section-title">
                    <span class="angebot-page__step-number">1</span>
                    Volumenberechnung für Ihren Umzug
                </h2>
                <VolumeCalculator bind:volumeM3 bind:itemSummary />
            </section>

            <!-- Step 2: Contact Form -->
            <section class="angebot-page__section">
                <h2 class="angebot-page__section-title">
                    <span class="angebot-page__step-number">2</span>
                    Ihre Kontaktdaten
                </h2>

                <div class="angebot-page__form-grid">
                    <div class="angebot-page__form-group">
                        <label for="name">Ihr Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            bind:value={formData.name}
                            placeholder="Max Mustermann"
                            required
                        />
                    </div>

                    <div class="angebot-page__form-group">
                        <label for="email">E-Mail-Adresse *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            bind:value={formData.email}
                            placeholder="max@beispiel.de"
                            required
                        />
                    </div>

                    <div class="angebot-page__form-group">
                        <label for="phone">Telefonnummer *</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            bind:value={formData.phone}
                            placeholder="05121 1234567"
                            required
                        />
                    </div>

                    <div class="angebot-page__form-group">
                        <label for="date">Wunschtermin *</label>
                        <input
                            type="date"
                            id="date"
                            name="wunschtermin"
                            bind:value={formData.date}
                            required
                        />
                    </div>

                    <div class="angebot-page__form-group">
                        <label for="startAddress">Auszugsadresse *</label>
                        <input
                            type="text"
                            id="startAddress"
                            name="auszugsadresse"
                            bind:value={formData.startAddress}
                            placeholder="Straße, Nr., PLZ, Ort"
                            required
                        />
                    </div>

                    <div class="angebot-page__form-group">
                        <label for="startFloor">Etage Auszug *</label>
                        <select
                            id="startFloor"
                            name="etage-auszug"
                            bind:value={formData.startFloor}
                            required
                        >
                            {#each floorOptions as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="angebot-page__form-group angebot-page__form-group--full">
                        <label class="angebot-page__checkbox-label">
                            <input
                                type="checkbox"
                                name="halteverbot-auszug"
                                bind:checked={formData.halteverbotAuszug}
                            />
                            <span>Halteverbot benötigt? (optional)</span>
                        </label>
                    </div>

                    <!-- Zwischenstopp Toggle -->
                    <div class="angebot-page__form-group angebot-page__form-group--full">
                        <button
                            type="button"
                            class="angebot-page__zwischenstopp-toggle"
                            onclick={() => formData.hasZwischenstopp = !formData.hasZwischenstopp}
                        >
                            {#if formData.hasZwischenstopp}
                                <span>− Zwischenstopp entfernen</span>
                            {:else}
                                <span>+ Zwischenstopp hinzufügen (optional)</span>
                            {/if}
                        </button>
                    </div>

                    <!-- Zwischenstopp Fields (conditional) -->
                    {#if formData.hasZwischenstopp}
                        <div class="angebot-page__form-group angebot-page__form-group--full angebot-page__zwischenstopp-section">
                            <h3 class="angebot-page__subsection-title">Zwischenstopp</h3>
                        </div>

                        <div class="angebot-page__form-group">
                            <label for="zwischenstoppAddress">Zwischenstopp-Adresse</label>
                            <input
                                type="text"
                                id="zwischenstoppAddress"
                                name="zwischenstopp-adresse"
                                bind:value={formData.zwischenstoppAddress}
                                placeholder="Straße, Nr., PLZ, Ort"
                            />
                        </div>

                        <div class="angebot-page__form-group">
                            <label for="zwischenstoppFloor">Etage Zwischenstopp</label>
                            <select
                                id="zwischenstoppFloor"
                                name="etage-zwischenstopp"
                                bind:value={formData.zwischenstoppFloor}
                            >
                                {#each floorOptions as option}
                                    <option value={option.value}>{option.label}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="angebot-page__form-group angebot-page__form-group--full">
                            <label class="angebot-page__checkbox-label">
                                <input
                                    type="checkbox"
                                    name="halteverbot-zwischenstopp"
                                    bind:checked={formData.halteverbotZwischenstopp}
                                />
                                <span>Halteverbot benötigt? (optional)</span>
                            </label>
                        </div>
                    {/if}

                    <div class="angebot-page__form-group">
                        <label for="endAddress">Einzugsadresse *</label>
                        <input
                            type="text"
                            id="endAddress"
                            name="einzugsadresse"
                            bind:value={formData.endAddress}
                            placeholder="Straße, Nr., PLZ, Ort"
                            required
                        />
                    </div>

                    <div class="angebot-page__form-group">
                        <label for="endFloor">Etage Einzug *</label>
                        <select
                            id="endFloor"
                            name="etage-einzug"
                            bind:value={formData.endFloor}
                            required
                        >
                            {#each floorOptions as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="angebot-page__form-group angebot-page__form-group--full">
                        <label class="angebot-page__checkbox-label">
                            <input
                                type="checkbox"
                                name="halteverbot-einzug"
                                bind:checked={formData.halteverbotEinzug}
                            />
                            <span>Halteverbot benötigt? (optional)</span>
                        </label>
                    </div>
                </div>
            </section>

            <!-- Step 3: Additional Services -->
            <section class="angebot-page__section">
                <h2 class="angebot-page__section-title">
                    <span class="angebot-page__step-number">3</span>
                    Gewünschte Zusatzleistungen
                </h2>

                <div class="angebot-page__services-grid">
                    {#each additionalServices as service}
                        <label class="angebot-page__service-option">
                            <input
                                type="checkbox"
                                checked={formData.selectedServices.includes(
                                    service.id,
                                )}
                                onchange={() => toggleService(service.id)}
                            />
                            <span class="angebot-page__service-checkbox"></span>
                            <span class="angebot-page__service-label"
                                >{service.label}</span
                            >
                        </label>
                    {/each}
                </div>
            </section>

            <!-- Step 4: Message -->
            <section class="angebot-page__section">
                <h2 class="angebot-page__section-title">
                    <span class="angebot-page__step-number">4</span>
                    Ihre Nachricht (optional)
                </h2>

                <div class="angebot-page__form-group">
                    <textarea
                        id="message"
                        name="nachricht"
                        bind:value={formData.message}
                        placeholder="Weitere Details oder Fragen..."
                        rows={4}
                    ></textarea>
                </div>
            </section>

            <!-- Privacy & Submit -->
            <section
                class="angebot-page__section angebot-page__section--submit"
            >
                <label class="angebot-page__privacy">
                    <input
                        type="checkbox"
                        name="datenschutz-akzeptiert"
                        bind:checked={formData.privacyAccepted}
                        required
                    />
                    <span class="angebot-page__privacy-text">
                        Ich stimme zu, dass meine Angaben zur Bearbeitung meiner
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

    .angebot-page {
        background-color: #f4f6f8;
        min-height: 60vh;
        padding-block: var(--space-12);
    }

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

    .angebot-page__container {
        max-width: 900px;
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    /* Header */
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

    /* Form */
    .angebot-page__form {
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
    }

    /* Sections */
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
    }

    /* Form Grid */
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
        min-height: 120px;
    }

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

    /* Zwischenstopp Toggle Button */
    .angebot-page__zwischenstopp-toggle {
        width: 100%;
        padding: var(--space-3) var(--space-4);
        background-color: #f0f9ff;
        border: 2px dashed #3b82f6;
        border-radius: var(--radius-md);
        color: #1e40af;
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        cursor: pointer;
        transition: all var(--transition-fast);
        text-align: center;
    }

    .angebot-page__zwischenstopp-toggle:hover {
        background-color: #dbeafe;
        border-color: #2563eb;
    }

    .angebot-page__zwischenstopp-section {
        margin-top: var(--space-2);
        padding-top: var(--space-4);
        border-top: 2px solid #e2e8f0;
    }

    .angebot-page__subsection-title {
        color: #1e40af;
        font-size: var(--text-base);
        font-weight: var(--font-semibold);
        margin: 0;
    }

    /* Services Grid */
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
    }

    .angebot-page__service-option
        input:checked
        + .angebot-page__service-checkbox {
        background-color: var(--color-nav-accent);
        border-color: var(--color-nav-accent);
    }

    .angebot-page__service-option
        input:checked
        + .angebot-page__service-checkbox::after {
        content: "✓";
        color: white;
        font-size: 12px;
        font-weight: bold;
    }

    .angebot-page__service-label {
        color: #4a5568;
        font-size: var(--text-sm);
    }

    /* Privacy & Submit */
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

    /* Responsive */
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
    }

    @media (max-width: 480px) {
        .angebot-page__services-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
