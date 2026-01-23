<script lang="ts">
    import VolumeCalculator from "$lib/components/VolumeCalculator.svelte";
    import { Send } from "lucide-svelte";

    // Form state
    let formData = $state({
        name: "",
        email: "",
        phone: "",
        startAddress: "",
        endAddress: "",
        date: "",
        message: "",
        selectedServices: [] as string[],
        privacyAccepted: false,
    });

    const additionalServices = [
        { id: "packing", label: "Einpackservice" },
        { id: "unpacking", label: "Auspackservice" },
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
            formData.endAddress !== "" &&
            formData.date !== "" &&
            formData.privacyAccepted,
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
        if (!isFormValid) return;

        // Here you would send the form data to your backend
        alert("Vielen Dank! Ihre Anfrage wurde gesendet.");
    }
</script>

<svelte:head>
    <title>Kostenloses Angebot | Aust Umzüge Hildesheim</title>
    <meta
        name="description"
        content="Berechnen Sie Ihr Umzugsvolumen und erhalten Sie ein kostenloses Angebot von Aust Umzüge Hildesheim."
    />
</svelte:head>

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

        <form class="angebot-page__form" onsubmit={handleSubmit}>
            <!-- Step 1: Volume Calculator -->
            <section class="angebot-page__section">
                <h2 class="angebot-page__section-title">
                    <span class="angebot-page__step-number">1</span>
                    Volumenberechnung für Ihren Umzug
                </h2>
                <VolumeCalculator />
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
                            bind:value={formData.date}
                            required
                        />
                    </div>

                    <div
                        class="angebot-page__form-group angebot-page__form-group--full"
                    >
                        <label for="startAddress">Auszugsadresse *</label>
                        <input
                            type="text"
                            id="startAddress"
                            bind:value={formData.startAddress}
                            placeholder="Straße, Hausnummer, PLZ, Ort"
                            required
                        />
                    </div>

                    <div
                        class="angebot-page__form-group angebot-page__form-group--full"
                    >
                        <label for="endAddress">Einzugsadresse *</label>
                        <input
                            type="text"
                            id="endAddress"
                            bind:value={formData.endAddress}
                            placeholder="Straße, Hausnummer, PLZ, Ort"
                            required
                        />
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

                <button
                    type="submit"
                    class="angebot-page__submit"
                    disabled={!isFormValid}
                >
                    <Send size={20} />
                    <span>Kostenloses Angebot anfordern</span>
                </button>
            </section>
        </form>
    </div>
</main>

<style>
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
    .angebot-page__form-group textarea {
        padding: var(--space-3) var(--space-4);
        border: 1.5px solid #e2e8f0;
        border-radius: var(--radius-md);
        font-size: var(--text-base);
        background-color: #f8fafc;
        transition: all var(--transition-fast);
    }

    .angebot-page__form-group input:focus,
    .angebot-page__form-group textarea:focus {
        border-color: var(--color-nav-accent);
        background-color: var(--color-text);
        outline: none;
        box-shadow: 0 0 0 3px rgba(230, 81, 0, 0.1);
    }

    .angebot-page__form-group textarea {
        resize: vertical;
        min-height: 120px;
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
