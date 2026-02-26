<script lang="ts">
    import { Send } from "lucide-svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import { contactPage, createBreadcrumbs } from "$lib/data/structuredData";

    let formData = $state({
        name: "",
        email: "",
        phone: "",
        message: "",
        privacyAccepted: false,
    });

    let isSubmitting = $state(false);
    let submitSuccess = $state(false);
    let submitError = $state("");

    const isFormValid = $derived(
        formData.name !== "" &&
            formData.email !== "" &&
            formData.message !== "" &&
            formData.privacyAccepted,
    );

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
                    message: "",
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
        { name: "Kontakt" }
    ]);
</script>

<MetaTags
    title="Kontakt | Aust Umzüge Hildesheim"
    description="Kontaktieren Sie Aust Umzüge in Hildesheim. Wir stehen Ihnen für Fragen und Angebote gerne zur Verfügung."
    keywords="Kontakt Aust Umzüge, Umzugsfirma Hildesheim Kontakt, Umzugsanfrage, Umzugsberatung"
    canonical="https://www.aust-umzuege.de/kontakt"
/>

<StructuredData schema={contactPage} />
<StructuredData schema={breadcrumbs} />

<main class="contact-page">
    <div class="contact-page__container">
        <header class="contact-page__header">
            <h1 class="contact-page__title">Kontaktieren Sie uns</h1>
        </header>

        <div class="contact-page__grid">
        <section class="contact-form-section">
            {#if submitSuccess}
                <div class="contact-form__success">
                    <h2>Vielen Dank für Ihre Nachricht!</h2>
                    <p>Wir melden uns umgehend bei Ihnen.</p>
                    <button type="button" class="submit-button" onclick={() => submitSuccess = false}>
                        Neue Nachricht senden
                    </button>
                </div>
            {:else}
            <h2 class="contact-form__heading">
                Schreiben Sie uns eine Nachricht
            </h2>

            <form
                class="contact-form"
                onsubmit={handleSubmit}
                name="kontakt"
                method="POST"
                data-netlify="true"
                netlify-honeypot="bot-field"
                toolname="kontakt"
                tooldescription="Kontaktformular für allgemeine Anfragen an Aust Umzüge Hildesheim. Senden Sie eine Nachricht mit Name, E-Mail und Anliegen."
            >
                <!-- Netlify form detection -->
                <input type="hidden" name="form-name" value="kontakt" />
                <p class="hidden"><label>Don't fill this out: <input name="bot-field" /></label></p>

                <div class="contact-form__group">
                    <input
                        type="text"
                        id="name"
                        name="name"
                        bind:value={formData.name}
                        placeholder="Ihr Name:"
                        required
                        toolparamtitle="Name"
                        toolparamdescription="Vollständiger Name des Absenders"
                    />
                </div>

                <div class="contact-form__group">
                    <input
                        type="email"
                        id="email"
                        name="email"
                        bind:value={formData.email}
                        placeholder="Ihre E-Mail-Adresse:"
                        required
                        toolparamtitle="E-Mail"
                        toolparamdescription="E-Mail-Adresse für die Rückmeldung"
                    />
                </div>

                <div class="contact-form__group">
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        bind:value={formData.phone}
                        placeholder="Ihre Telefonnummer:"
                        toolparamtitle="Telefon"
                        toolparamdescription="Telefonnummer für Rückruf (optional)"
                    />
                </div>

                <div class="contact-form__group">
                    <textarea
                        id="message"
                        name="nachricht"
                        bind:value={formData.message}
                        rows="4"
                        placeholder="Ihre Nachricht:"
                        required
                        toolparamtitle="Nachricht"
                        toolparamdescription="Ihre Nachricht oder Anfrage an Aust Umzüge"
                    ></textarea>
                </div>

                <div class="contact-form__privacy">
                    <label class="checkbox-label">
                        <input
                            type="checkbox"
                            name="datenschutz-akzeptiert"
                            bind:checked={formData.privacyAccepted}
                            required
                        />
                        <span class="checkbox-custom"></span>
                        <span class="label-text">
                            Ich habe die <a href="/datenschutz" target="_blank"
                                >Datenschutzerklärung</a
                            > gelesen und akzeptiert.
                        </span>
                    </label>
                </div>

                {#if submitError}
                    <p class="contact-form__error">{submitError}</p>
                {/if}

                <button
                    type="submit"
                    class="submit-button"
                    disabled={!isFormValid || isSubmitting}
                >
                    {#if isSubmitting}
                        WIRD GESENDET...
                    {:else}
                        JETZT ANFRAGEN
                    {/if}
                </button>
            </form>
            {/if}
        </section>

        <aside class="contact-info">
            <h2 class="contact-info__heading">Kontaktdaten</h2>

            <div class="contact-info__item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                <div>
                    <span class="contact-info__label">Telefon</span>
                    <a href="tel:+4951217558379" class="contact-info__value">05121 / 755 83 79</a>
                </div>
            </div>

            <div class="contact-info__item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                </svg>
                <div>
                    <span class="contact-info__label">E-Mail</span>
                    <a href="mailto:info@aust-umzuege.de" class="contact-info__value">info@aust-umzuege.de</a>
                </div>
            </div>

            <div class="contact-info__item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
                <div>
                    <span class="contact-info__label">Adresse</span>
                    <a href="https://maps.app.goo.gl/KUs8ajSyfU6iwEqw9" target="_blank" rel="noopener noreferrer" class="contact-info__value">
                        Kaiserstr. 32<br />31134 Hildesheim
                    </a>
                </div>
            </div>

            <div class="contact-info__item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <div>
                    <span class="contact-info__label">Bürozeiten</span>
                    <span class="contact-info__value">Montag – Freitag<br />09:00 – 19:00 Uhr</span>
                </div>
            </div>
        </aside>
        </div>
    </div>
</main>

<style>
    .hidden {
        display: none;
    }

    .contact-page {
        background-color: #ffffff;
        min-height: 80vh;
        padding-block: var(--space-12);
    }

    .contact-form__success {
        text-align: center;
        padding: var(--space-10);
    }

    .contact-form__success h2 {
        color: var(--color-info-bar);
        margin: 0 0 var(--space-4);
    }

    .contact-form__success p {
        color: #4a5568;
        margin: 0 0 var(--space-6);
    }

    .contact-form__error {
        color: #dc2626;
        font-size: var(--text-sm);
        margin: 0 0 var(--space-4);
    }

    .contact-page__container {
        max-width: 1000px;
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .contact-page__grid {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: var(--space-10);
        align-items: start;
    }

    .contact-page__header {
        text-align: center;
        margin-bottom: var(--space-10);
    }

    .contact-page__title {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
        font-weight: var(--font-bold);
        position: relative;
        display: inline-block;
        padding-bottom: var(--space-4);
    }

    .contact-page__title::after {
        content: "";
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        width: 80px;
        height: 4px;
        background: linear-gradient(90deg, var(--color-nav-accent), #ff8a3d);
        border-radius: var(--radius-full);
    }

    .contact-form__heading {
        color: #333;
        font-size: clamp(var(--text-xl), 4vw, var(--text-2xl));
        font-weight: var(--font-medium);
        margin-bottom: var(--space-8);
        line-height: 1.4;
    }

    .contact-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .contact-form__group input,
    .contact-form__group textarea {
        width: 100%;
        padding: var(--space-3) var(--space-4);
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-sm);
        font-size: var(--text-base);
        color: #4a5568;
        background-color: #fff;
        transition: all var(--transition-fast);
        outline: none;
        font-family: inherit;
    }

    .contact-form__group input::placeholder,
    .contact-form__group textarea::placeholder {
        color: #a0aec0;
        font-weight: var(--font-regular);
    }

    .contact-form__group input:focus,
    .contact-form__group textarea:focus {
        border-color: var(--color-nav-accent);
        box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
    }

    .contact-form__group textarea {
        resize: vertical;
        min-height: 150px;
    }

    /* Privacy Checkbox */
    .contact-form__privacy {
        margin-top: var(--space-2);
        margin-bottom: var(--space-4);
    }

    .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        cursor: pointer;
        font-size: var(--text-sm);
        color: #4a5568;
    }

    .checkbox-label input {
        display: none;
    }

    .checkbox-custom {
        width: 18px;
        height: 18px;
        border: 1px solid #cbd5e0;
        border-radius: 2px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-fast);
        margin-top: 3px;
    }

    .checkbox-label input:checked + .checkbox-custom {
        background-color: var(--color-nav-accent);
        border-color: var(--color-nav-accent);
    }

    .checkbox-label input:checked + .checkbox-custom::after {
        content: "✓";
        color: white;
        font-size: 12px;
        font-weight: bold;
    }

    .checkbox-label a {
        color: #d14452; /* Reddish tone from screenshot 'Datenschutzerklärung' */
        text-decoration: underline; /* Always underlined for accessibility */
    }

    .checkbox-label a:hover {
        text-decoration: underline;
        opacity: 0.8; /* Slight opacity change on hover */
    }

    /* Submit Button */
    .submit-button {
        background-color: #ff6b00; /* Bright orange from screenshot */
        color: white;
        border: none;
        padding: var(--space-3) var(--space-6);
        font-size: var(--text-sm);
        font-weight: var(--font-bold);
        text-transform: uppercase;
        cursor: pointer;
        transition: background-color var(--transition-fast);
        align-self: flex-start; /* Left aligned like screenshot */
        border-radius: 2px;
    }

    .submit-button:hover:not(:disabled) {
        background-color: #e65100;
    }

    .submit-button:disabled {
        background-color: #cbd5e0;
        cursor: not-allowed;
    }

    /* Contact info sidebar */
    .contact-info {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
    }

    .contact-info__heading {
        color: var(--color-info-bar);
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        margin: 0;
    }

    .contact-info__item {
        display: flex;
        gap: var(--space-3);
        align-items: flex-start;
    }

    .contact-info__item svg {
        color: var(--color-nav-accent);
        flex-shrink: 0;
        margin-top: 2px;
    }

    .contact-info__label {
        display: block;
        font-size: var(--text-xs, 0.75rem);
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: var(--font-semibold);
        margin-bottom: 2px;
    }

    .contact-info__value {
        color: #333;
        font-size: var(--text-sm);
        line-height: 1.5;
        text-decoration: none;
    }

    a.contact-info__value:hover {
        color: var(--color-nav-accent);
    }

    @media (max-width: 768px) {
        .contact-page__grid {
            grid-template-columns: 1fr;
        }

        .contact-info {
            order: -1;
        }
    }

    @media (max-width: 640px) {
        .contact-page__title {
            font-size: var(--text-2xl);
        }
    }
</style>
