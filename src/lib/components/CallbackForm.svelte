<script lang="ts">
    // Shared callback form. Used in HeroV2 (hero card) and StickyCallback (popover).
    // Submits to /api/v1/flash-contact and broadcasts an `aust:callback:submitted`
    // window event + sessionStorage flag so other surfaces (sticky FAB) can react.
    import { ArrowRight } from "lucide-svelte";
    import { API_BASE } from "$lib/utils/api.svelte";

    interface Props {
        compact?: boolean;
        autofocus?: boolean;
        onSuccess?: () => void;
    }
    let { compact = false, autofocus = false, onSuccess }: Props = $props();

    type TimePref = "gleich" | "vormittag" | "nachmittag";
    const timeSlots: { value: TimePref; label: string }[] = [
        { value: "gleich", label: "Jetzt gleich" },
        { value: "vormittag", label: "Vormittag" },
        { value: "nachmittag", label: "Nachmittag" },
    ];

    let cbName = $state("");
    let cbPhone = $state("");
    let cbTime = $state<TimePref>("gleich");
    let cbCompany = $state(""); // honeypot
    let cbSubmitting = $state(false);
    let cbDone = $state(false);
    let cbError = $state<string | null>(null);
    let nameInput: HTMLInputElement | undefined = $state();

    $effect(() => {
        if (autofocus && nameInput) {
            nameInput.focus();
        }
    });

    function isPlausiblePhone(v: string): boolean {
        return v.replace(/\D/g, "").length >= 6;
    }

    async function submitCallback(e: Event) {
        e.preventDefault();
        cbError = null;
        if (cbCompany) {
            cbDone = true;
            broadcastSuccess();
            return;
        }
        const name = cbName.trim();
        const phone = cbPhone.trim();
        if (!name || !phone) {
            cbError = "Bitte Name und Telefonnummer angeben.";
            return;
        }
        if (!isPlausiblePhone(phone)) {
            cbError = "Bitte eine gültige Telefonnummer eingeben.";
            return;
        }
        cbSubmitting = true;
        try {
            const res = await fetch(`${API_BASE}/api/v1/flash-contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    phone,
                    time_preference: cbTime,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            cbDone = true;
            broadcastSuccess();
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const w = window as any;
                if (typeof w.plausible === "function") {
                    w.plausible("Callback Submitted", { props: { time: cbTime } });
                } else if (Array.isArray(w.dataLayer)) {
                    w.dataLayer.push({ event: "callback_submitted", time_preference: cbTime });
                }
            } catch {
                /* noop */
            }
        } catch {
            cbError = "Senden fehlgeschlagen. Bitte später erneut versuchen oder direkt anrufen.";
        } finally {
            cbSubmitting = false;
        }
    }

    function broadcastSuccess() {
        try {
            sessionStorage.setItem("aust:callback:submitted", "1");
        } catch {
            /* sessionStorage may be unavailable in private mode */
        }
        try {
            window.dispatchEvent(new CustomEvent("aust:callback:submitted"));
        } catch {
            /* noop */
        }
        onSuccess?.();
    }
</script>

<div class="cb" class:cb--compact={compact}>
    <div class="cb-headline">
        <strong>Alex ruft Sie persönlich zurück</strong>
        <span>Kostenlos &amp; unverbindlich · Mo–Fr 8–18 Uhr</span>
    </div>

    {#if cbDone}
        <p class="cb-success" role="status">
            Vielen Dank — Alex meldet sich in Kürze bei Ihnen.
        </p>
    {:else}
        <form class="cb-form" onsubmit={submitCallback} novalidate>
            <div class="cb-row">
                <input
                    type="text"
                    bind:this={nameInput}
                    bind:value={cbName}
                    placeholder="Name"
                    required
                    maxlength="120"
                    autocomplete="name"
                    aria-label="Name"
                />
                <input
                    type="tel"
                    bind:value={cbPhone}
                    placeholder="Telefonnummer"
                    required
                    maxlength="40"
                    inputmode="tel"
                    autocomplete="tel"
                    aria-label="Telefonnummer"
                />
                <button type="submit" disabled={cbSubmitting}>
                    {cbSubmitting ? "Sende …" : "Jetzt zurückrufen lassen"}
                    {#if !cbSubmitting}
                        <ArrowRight size={16} strokeWidth={2.75} />
                    {/if}
                </button>
            </div>
            <div class="cb-hp" aria-hidden="true">
                <label>
                    Firma (bitte freilassen)
                    <input
                        type="text"
                        bind:value={cbCompany}
                        tabindex="-1"
                        autocomplete="off"
                    />
                </label>
            </div>
            <div class="cb-times" role="radiogroup" aria-label="Wann sollen wir anrufen?">
                <span class="cb-times-label">Wann?</span>
                {#each timeSlots as slot (slot.value)}
                    <label class:active={cbTime === slot.value}>
                        <input
                            type="radio"
                            bind:group={cbTime}
                            value={slot.value}
                        />
                        {slot.label}
                    </label>
                {/each}
            </div>
            <p class="cb-fineprint">
                Keine Werbung. Nur Ihr Rückruf. Antwort meist innerhalb 30 Minuten während der Geschäftszeiten.
            </p>
        </form>
        {#if cbError}
            <p class="cb-error" role="alert">{cbError}</p>
        {/if}
    {/if}
</div>

<style>
    .cb {
        --cb-orange: var(--color-nav-accent, #c44100);
        --cb-navy: #1e3a5f;
        --cb-ink: #1a1f2e;
        --cb-mute: #5b6478;
        --cb-line: #e6e8ed;
        --cb-surface: #fafafa;

        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        color: var(--cb-ink);
    }
    .cb--compact { gap: 0.7rem; }

    .cb-headline {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        min-width: 0;
    }
    .cb-headline strong {
        font-size: 1rem;
        font-weight: 800;
        color: var(--cb-navy);
        letter-spacing: -0.01em;
        line-height: 1.2;
    }
    .cb-headline span {
        font-size: 0.78rem;
        color: var(--cb-mute);
        line-height: 1.3;
    }

    .cb-form { display: flex; flex-direction: column; gap: 0.55rem; }
    .cb-row {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 0.5rem;
    }
    .cb--compact .cb-row { grid-template-columns: 1fr; }
    .cb--compact .cb-row button { width: 100%; justify-content: center; }
    @media (max-width: 700px) {
        .cb-row { grid-template-columns: 1fr; }
        .cb-row button { width: 100%; justify-content: center; }
    }

    .cb-hp {
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
    }

    .cb-times {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.4rem;
    }
    .cb-times-label {
        font-size: 0.78rem;
        color: var(--cb-mute);
        font-weight: 600;
        margin-right: 0.15rem;
    }
    .cb-times label {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.35rem 0.7rem;
        background: var(--cb-surface);
        border: 1px solid var(--cb-line);
        border-radius: 999px;
        cursor: pointer;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--cb-mute);
        transition: border-color 0.15s, color 0.15s, background 0.15s;
        user-select: none;
    }
    .cb-times label:hover {
        border-color: var(--cb-orange);
        color: var(--cb-orange);
    }
    .cb-times label.active {
        background: var(--cb-orange);
        border-color: var(--cb-orange);
        color: #fff;
    }
    .cb-times input[type="radio"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .cb-form input[type="text"],
    .cb-form input[type="tel"] {
        background: var(--cb-surface);
        border: 1px solid var(--cb-line);
        border-radius: 0.55rem;
        padding: 0.75rem 0.85rem;
        font: inherit;
        font-size: 0.95rem;
        color: var(--cb-ink);
        outline: none;
        min-width: 0;
        transition: border-color 0.15s, box-shadow 0.15s;
    }
    .cb-form input:focus {
        border-color: var(--cb-orange);
        box-shadow: 0 0 0 3px rgba(196, 65, 0, 0.18);
    }
    .cb-form button {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        background: var(--cb-orange);
        color: #fff;
        border: none;
        border-radius: 0.55rem;
        padding: 0.75rem 1.15rem;
        font: inherit;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 6px 14px rgba(196, 65, 0, 0.25);
        white-space: nowrap;
    }
    .cb-form button:hover:not(:disabled) {
        background: #a83700;
        transform: translateY(-1px);
    }
    .cb-form button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
    }

    .cb-fineprint {
        font-size: 0.72rem;
        color: var(--cb-mute);
        line-height: 1.4;
        margin: 0.1rem 0 0;
    }
    .cb-success {
        font-size: 0.95rem;
        color: var(--cb-navy);
        font-weight: 600;
        margin: 0;
    }
    .cb-error {
        font-size: 0.82rem;
        color: #dc2626;
        margin: 0;
    }
</style>
