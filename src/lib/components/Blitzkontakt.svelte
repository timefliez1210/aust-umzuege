<script lang="ts">
    // Blitzkontakt — ultra-quick callback request.
    // Posts to public /api/v1/flash-contact; backend pings Alex on Telegram immediately.
    import { Phone } from "lucide-svelte";
    import { API_BASE } from "$lib/utils/api.svelte";

    type TimePref = "any_time" | "08-10" | "10-12" | "14-16" | "16-18";

    let name = $state("");
    let phone = $state("");
    let timePref = $state<TimePref>("any_time");
    let submitting = $state(false);
    let done = $state(false);
    let error = $state<string | null>(null);

    const slots: { value: TimePref; label: string }[] = [
        { value: "any_time", label: "Jederzeit" },
        { value: "08-10", label: "08–10" },
        { value: "10-12", label: "10–12" },
        { value: "14-16", label: "14–16" },
        { value: "16-18", label: "16–18" },
    ];

    async function submit(e: Event) {
        e.preventDefault();
        error = null;
        if (!name.trim() || !phone.trim()) {
            error = "Bitte Name und Telefonnummer angeben.";
            return;
        }
        submitting = true;
        try {
            const res = await fetch(`${API_BASE}/api/v1/flash-contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phone.trim(),
                    time_preference: timePref,
                }),
            });
            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(body || `HTTP ${res.status}`);
            }
            done = true;
        } catch (e) {
            error = (e as Error).message || "Senden fehlgeschlagen.";
        } finally {
            submitting = false;
        }
    }
</script>

<section class="blitz">
    <div class="blitz__container">
        <div class="blitz__intro">
            <span class="blitz__eyebrow">
                <Phone size={14} strokeWidth={2.25} />
                Rückruf-Service
            </span>
            <h2 class="blitz__title">Wir rufen Sie zurück.</h2>
            <p class="blitz__lead">
                Hinterlassen Sie uns Ihre Nummer und eine Wunschzeit — kein
                Formular-Marathon, kein Warten. Persönliche Beratung von Alex.
            </p>
        </div>

        <div class="blitz__card">
            {#if done}
                <div class="blitz__success">
                    <h3>Vielen Dank.</h3>
                    <p>Wir melden uns in der gewählten Zeit bei Ihnen.</p>
                </div>
            {:else}
                <form class="blitz__form" onsubmit={submit}>
                    <div class="blitz__row">
                        <label class="blitz__field">
                            <span>Name</span>
                            <input
                                type="text"
                                bind:value={name}
                                required
                                maxlength="120"
                                autocomplete="name"
                                placeholder="Ihr Name"
                            />
                        </label>
                        <label class="blitz__field">
                            <span>Telefon</span>
                            <input
                                type="tel"
                                bind:value={phone}
                                required
                                maxlength="40"
                                autocomplete="tel"
                                placeholder="0151 …"
                            />
                        </label>
                    </div>

                    <fieldset class="blitz__times">
                        <legend>Wunschzeit</legend>
                        <div class="blitz__time-grid">
                            {#each slots as slot (slot.value)}
                                <label class:active={timePref === slot.value}>
                                    <input
                                        type="radio"
                                        bind:group={timePref}
                                        value={slot.value}
                                    />
                                    {slot.label}
                                </label>
                            {/each}
                        </div>
                    </fieldset>

                    {#if error}
                        <p class="blitz__error">{error}</p>
                    {/if}

                    <button class="blitz__submit" type="submit" disabled={submitting}>
                        {submitting ? "Wird gesendet …" : "Rückruf anfordern"}
                    </button>
                </form>
            {/if}
        </div>
    </div>
</section>

<style>
    .blitz {
        background: var(--color-background);
        padding-block: var(--space-20);
        padding-inline: var(--container-padding);
        border-top: 1px solid var(--color-border);
        border-bottom: 1px solid var(--color-border);
    }
    .blitz__container {
        max-width: var(--container-max);
        margin-inline: auto;
        display: grid;
        grid-template-columns: 1fr 1.1fr;
        gap: var(--space-16);
        align-items: center;
    }
    @media (max-width: 900px) {
        .blitz__container {
            grid-template-columns: 1fr;
            gap: var(--space-10);
        }
    }
    .blitz__intro {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }
    .blitz__eyebrow {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-nav-accent);
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    .blitz__title {
        color: var(--color-text);
        font-size: clamp(var(--text-3xl), 4vw, var(--text-4xl));
        font-weight: var(--font-bold);
        line-height: 1.15;
        margin: 0;
    }
    .blitz__lead {
        color: var(--color-text-muted);
        font-size: var(--text-lg);
        line-height: var(--leading-relaxed);
        margin: 0;
        max-width: 46ch;
    }

    .blitz__card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        padding: var(--space-8);
        box-shadow: var(--shadow-lg);
    }
    @media (max-width: 600px) {
        .blitz__card {
            padding: var(--space-6);
        }
    }

    .blitz__form {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
    }
    .blitz__row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
    }
    @media (max-width: 520px) {
        .blitz__row {
            grid-template-columns: 1fr;
        }
    }
    .blitz__field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }
    .blitz__field span {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    .blitz__field input {
        background: var(--color-background);
        color: var(--color-text);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 0.75rem 0.9rem;
        font-size: var(--text-base);
        font-family: inherit;
        transition: border-color 0.15s, box-shadow 0.15s;
    }
    .blitz__field input::placeholder {
        color: var(--color-text-muted);
        opacity: 0.55;
    }
    .blitz__field input:focus {
        outline: none;
        border-color: var(--color-nav-accent);
        box-shadow: 0 0 0 3px rgba(196, 65, 0, 0.15);
    }

    .blitz__times {
        border: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }
    .blitz__times legend {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0;
        margin-bottom: var(--space-1);
    }
    .blitz__time-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--space-2);
    }
    @media (max-width: 600px) {
        .blitz__time-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    .blitz__time-grid label {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.6rem 0.4rem;
        background: var(--color-background);
        color: var(--color-text);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        transition: border-color 0.15s, color 0.15s, background 0.15s;
        user-select: none;
    }
    .blitz__time-grid label:hover {
        border-color: var(--color-nav-accent);
        color: var(--color-nav-accent);
    }
    .blitz__time-grid label.active {
        background: var(--color-nav-accent);
        border-color: var(--color-nav-accent);
        color: #fff;
    }
    .blitz__time-grid input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .blitz__submit {
        margin-top: var(--space-2);
        padding: 0.95rem 1.25rem;
        background: var(--color-nav-accent);
        color: #fff;
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--text-base);
        font-weight: var(--font-semibold);
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s, transform 0.15s;
    }
    .blitz__submit:hover:not(:disabled) {
        background: #a83700;
    }
    .blitz__submit:active:not(:disabled) {
        transform: translateY(1px);
    }
    .blitz__submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .blitz__error {
        color: #f87171;
        font-size: var(--text-sm);
        margin: 0;
    }

    .blitz__success {
        text-align: center;
        padding: var(--space-4) 0;
    }
    .blitz__success h3 {
        color: var(--color-text);
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        margin: 0 0 var(--space-2) 0;
    }
    .blitz__success p {
        color: var(--color-text-muted);
        margin: 0;
    }
</style>
