<script lang="ts">
    // Floating callback CTA + popover. Watches the hero form (#rueckruf) and
    // appears once it scrolls out of view. Hides when:
    //   - the hero form is back in view (no duplicate CTAs)
    //   - the user has already submitted (sessionStorage flag)
    //   - the user dismissed it this session
    import { onMount, tick } from "svelte";
    import { Phone, X } from "lucide-svelte";
    import CallbackForm from "$lib/components/CallbackForm.svelte";

    interface Props {
        watchSelector?: string;
    }
    let { watchSelector = "#rueckruf" }: Props = $props();

    let heroVisible = $state(true);
    let heroEverSeen = $state(false);
    let open = $state(false);
    let submitted = $state(false);
    let dismissed = $state(false);
    let mounted = $state(false);
    let flying = $state(false);
    let flyStartTop = $state("5rem");
    let flyStartLeft = $state("1.25rem");
    let flyStartWidth = $state("280px");
    const FLY_DURATION = 750;

    let fabBtn: HTMLButtonElement | undefined = $state();
    let popoverRoot: HTMLDivElement | undefined = $state();

    const fabVisible = $derived(mounted && !heroVisible && !submitted && !dismissed && !open && !flying);
    const popoverVisible = $derived(mounted && open && !submitted);

    onMount(() => {
        mounted = true;
        try {
            if (sessionStorage.getItem("aust:callback:submitted") === "1") submitted = true;
            if (sessionStorage.getItem("aust:callback:dismissed") === "1") dismissed = true;
        } catch {
            /* private mode */
        }

        const onSubmittedEvt = () => {
            submitted = true;
            open = false;
        };
        window.addEventListener("aust:callback:submitted", onSubmittedEvt);

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) {
                e.preventDefault();
                close();
            }
        };
        window.addEventListener("keydown", onKey);

        const prefersReducedMotion = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)",
        ).matches ?? false;

        // IntersectionObserver on the hero form. If element is missing on this
        // page (e.g. landing pages without HeroV2), fall back to: always show.
        const target = document.querySelector(watchSelector);
        let io: IntersectionObserver | null = null;
        let flyTimer: ReturnType<typeof setTimeout> | null = null;

        if (target) {
            // Multiple thresholds so we can detect "form is leaving" while it's
            // still partially in view — the fly ghost must visually originate
            // from the form, not appear after it's off-screen.
            let prevRatio = 1;
            io = new IntersectionObserver(
                ([entry]) => {
                    const ratio = entry.intersectionRatio;
                    const stillIntersecting = entry.isIntersecting;

                    if (ratio >= 0.85) {
                        heroEverSeen = true;
                        flying = false;
                        if (flyTimer) {
                            clearTimeout(flyTimer);
                            flyTimer = null;
                        }
                    }

                    // Trigger the fly while the form is still well-visible
                    // (ratio crossing ~0.7 going down). The ghost must be
                    // clear of the fixed nav (InfoBar ~40px + Navbar 76–80px),
                    // so we clamp the start-top below it.
                    const leavingNow =
                        prevRatio > 0.7 && ratio <= 0.7 && stillIntersecting;

                    if (
                        leavingNow &&
                        heroEverSeen &&
                        !submitted &&
                        !dismissed &&
                        !open &&
                        !flying &&
                        !prefersReducedMotion
                    ) {
                        const rect = target.getBoundingClientRect();
                        const navBottom = window.innerWidth >= 768 ? 130 : 90;
                        flyStartTop = `${Math.max(rect.top, navBottom)}px`;
                        flyStartLeft = `${Math.max(rect.left, 12)}px`;
                        flyStartWidth = `${Math.min(rect.width, window.innerWidth - 24)}px`;
                        flying = true;
                        if (flyTimer) clearTimeout(flyTimer);
                        flyTimer = setTimeout(() => {
                            flying = false;
                            flyTimer = null;
                        }, FLY_DURATION);
                    }

                    heroVisible = stillIntersecting && ratio > 0.05;
                    prevRatio = ratio;
                },
                { threshold: [0, 0.05, 0.7, 0.85, 1] },
            );
            io.observe(target);
        } else {
            heroVisible = false;
        }

        return () => {
            window.removeEventListener("aust:callback:submitted", onSubmittedEvt);
            window.removeEventListener("keydown", onKey);
            io?.disconnect();
            if (flyTimer) clearTimeout(flyTimer);
        };
    });

    async function openPopover() {
        open = true;
        await tick();
        // Focus is handled by CallbackForm's autofocus on the name input.
    }

    function close() {
        open = false;
        // Return focus to the FAB for keyboard users.
        queueMicrotask(() => fabBtn?.focus());
    }

    function dismiss(e: Event) {
        e.stopPropagation();
        dismissed = true;
        try {
            sessionStorage.setItem("aust:callback:dismissed", "1");
        } catch {
            /* noop */
        }
    }

    function onBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    function onSuccess() {
        // CallbackForm broadcasts the event; we react via the listener.
        // Add a short delay so the user reads the success state before we hide.
        setTimeout(() => {
            open = false;
        }, 2200);
    }
</script>

{#if flying}
    <div
        class="sticky-cb__fly"
        aria-hidden="true"
        style="--fly-start-top:{flyStartTop};--fly-start-left:{flyStartLeft};--fly-start-width:{flyStartWidth};"
    >
        <div class="sticky-cb__fly-headline">
            <strong>Alex ruft Sie persönlich zurück</strong>
            <span>Mo–Fr 8–18 Uhr</span>
        </div>
        <div class="sticky-cb__fly-pill">
            <span class="sticky-cb__fab-icon">
                <Phone size={18} strokeWidth={2.5} />
            </span>
            <span class="sticky-cb__fab-label">Rückruf</span>
        </div>
    </div>
{/if}

{#if fabVisible}
    <div class="sticky-cb__fab-wrap">
        <button
            class="sticky-cb__fab"
            bind:this={fabBtn}
            onclick={openPopover}
            type="button"
            aria-label="Rückruf von Alex anfordern"
        >
            <span class="sticky-cb__fab-icon" aria-hidden="true">
                <Phone size={18} strokeWidth={2.5} />
            </span>
            <span class="sticky-cb__fab-label">Rückruf</span>
            <span class="sticky-cb__fab-pulse" aria-hidden="true"></span>
        </button>
        <button
            class="sticky-cb__fab-dismiss"
            onclick={dismiss}
            type="button"
            aria-label="Rückruf-Hinweis ausblenden"
            title="Ausblenden"
        >
            <X size={12} strokeWidth={3} />
        </button>
    </div>
{/if}

{#if popoverVisible}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="sticky-cb__backdrop"
        onclick={onBackdropClick}
        bind:this={popoverRoot}
    >
        <div
            class="sticky-cb__popover"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sticky-cb-title"
        >
            <button
                class="sticky-cb__close"
                onclick={close}
                type="button"
                aria-label="Schließen"
            >
                <X size={18} strokeWidth={2.5} />
            </button>
            <div id="sticky-cb-title" class="sr-only">Rückruf anfordern</div>
            <CallbackForm compact autofocus {onSuccess} />
        </div>
    </div>
{/if}

<style>
    /* Fly-in ghost — animates form → FAB so the user understands the connection.
       The ghost is fixed-positioned, slides down the left edge while the
       headline fades out and the compact pill fades in. */
    .sticky-cb__fly {
        position: fixed;
        z-index: 60;
        background: var(--color-nav-accent, #c44100);
        color: #fff;
        border-radius: 0.85rem;
        padding: 0.7rem 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        box-shadow: 0 12px 28px -6px rgba(196, 65, 0, 0.45), 0 2px 4px rgba(0, 0, 0, 0.12);
        pointer-events: none;
        animation: sticky-cb-fly 750ms cubic-bezier(0.34, 0.05, 0.2, 1) forwards;
        will-change: transform, top, left, width, border-radius;
    }
    .sticky-cb__fly-headline {
        display: flex;
        flex-direction: column;
        gap: 0.05rem;
        line-height: 1.2;
        animation: sticky-cb-fly-headline 750ms cubic-bezier(0.34, 0.05, 0.2, 1) forwards;
        white-space: nowrap;
        overflow: hidden;
    }
    .sticky-cb__fly-headline strong {
        font-size: 0.92rem;
        font-weight: 800;
        letter-spacing: -0.01em;
    }
    .sticky-cb__fly-headline span {
        font-size: 0.72rem;
        opacity: 0.92;
    }
    .sticky-cb__fly-pill {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        font-weight: 700;
        font-size: 0.95rem;
        opacity: 0;
        animation: sticky-cb-fly-pill 750ms cubic-bezier(0.34, 0.05, 0.2, 1) forwards;
        white-space: nowrap;
    }
    @keyframes sticky-cb-fly {
        0%   {
            top: var(--fly-start-top, 5rem);
            left: var(--fly-start-left, 1.25rem);
            width: var(--fly-start-width, 280px);
            border-radius: 0.85rem;
            transform: scale(1);
            opacity: 0;
        }
        15%  {
            top: var(--fly-start-top, 5rem);
            left: var(--fly-start-left, 1.25rem);
            width: var(--fly-start-width, 280px);
            border-radius: 0.85rem;
            transform: scale(1);
            opacity: 1;
        }
        100% {
            top: calc(100vh - 1.75rem - 50px);
            left: 1.25rem;
            width: 140px;
            border-radius: 999px;
            transform: scale(1);
            opacity: 1;
        }
    }
    @keyframes sticky-cb-fly-headline {
        0%, 30%   { opacity: 1; max-width: 280px; }
        55%, 100% { opacity: 0; max-width: 0; }
    }
    @keyframes sticky-cb-fly-pill {
        0%, 50%   { opacity: 0; max-width: 0; }
        75%, 100% { opacity: 1; max-width: 200px; }
    }

    /* FAB — bottom left, doesn't collide with WhatsApp/CallButton on the right */
    .sticky-cb__fab-wrap {
        position: fixed;
        left: 1.25rem;
        bottom: 1.75rem;
        z-index: 60;
    }

    .sticky-cb__fab {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        background: var(--color-nav-accent, #c44100);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 0.85rem 1.15rem 0.85rem 0.95rem;
        font: inherit;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 12px 28px -6px rgba(196, 65, 0, 0.45), 0 2px 4px rgba(0, 0, 0, 0.12);
        transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    }
    .sticky-cb__fab:hover {
        background: #a83700;
        transform: translateY(-2px);
        box-shadow: 0 16px 32px -6px rgba(196, 65, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.14);
    }
    .sticky-cb__fab:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 2px;
    }
    .sticky-cb__fab-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.18);
    }
    .sticky-cb__fab-pulse {
        position: absolute;
        inset: 0;
        border-radius: 999px;
        pointer-events: none;
        box-shadow: 0 0 0 0 rgba(196, 65, 0, 0.55);
        animation: sticky-cb-pulse 2.4s ease-out 0.4s 2;
    }
    @keyframes sticky-cb-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(196, 65, 0, 0.55); }
        70%  { box-shadow: 0 0 0 14px rgba(196, 65, 0, 0); }
        100% { box-shadow: 0 0 0 0 rgba(196, 65, 0, 0); }
    }

    .sticky-cb__fab-dismiss {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #1e3a5f;
        color: #fff;
        border: 2px solid #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        opacity: 0.85;
        transition: opacity 0.15s, transform 0.15s;
    }
    .sticky-cb__fab-dismiss:hover { opacity: 1; transform: scale(1.08); }
    .sticky-cb__fab-dismiss:focus-visible {
        outline: 2px solid var(--color-nav-accent, #c44100);
        outline-offset: 2px;
        opacity: 1;
    }

    @media (max-width: 480px) {
        .sticky-cb__fab-wrap {
            left: 1rem;
            bottom: 1rem;
        }
        .sticky-cb__fab-label { display: none; }
        .sticky-cb__fab {
            padding: 0.85rem;
        }
    }

    /* Popover */
    .sticky-cb__backdrop {
        position: fixed;
        inset: 0;
        z-index: 70;
        background: rgba(20, 40, 63, 0.45);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: flex-end;
        justify-content: flex-start;
        padding: 1.25rem;
        animation: sticky-cb-fade 0.18s ease-out;
    }
    @keyframes sticky-cb-fade {
        from { opacity: 0; }
        to   { opacity: 1; }
    }

    .sticky-cb__popover {
        position: relative;
        background: #fff;
        border: 1px solid #e6e8ed;
        border-top: 3px solid var(--color-nav-accent, #c44100);
        border-radius: 0.85rem;
        padding: 1.25rem 1.25rem 1.1rem;
        width: min(420px, 100%);
        box-shadow: 0 24px 60px -12px rgba(20, 40, 63, 0.45);
        transform-origin: bottom left;
        animation: sticky-cb-pop 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.1);
    }
    @keyframes sticky-cb-pop {
        from { opacity: 0; transform: translateY(20px) scale(0.85); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (max-width: 600px) {
        .sticky-cb__backdrop {
            justify-content: center;
            padding: 0;
            align-items: flex-end;
        }
        .sticky-cb__popover {
            width: 100%;
            max-width: none;
            border-radius: 0.85rem 0.85rem 0 0;
            transform-origin: bottom center;
        }
    }

    .sticky-cb__close {
        position: absolute;
        top: 0.55rem;
        right: 0.55rem;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: transparent;
        border: none;
        color: #5b6478;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, color 0.15s;
    }
    .sticky-cb__close:hover {
        background: #f1f3f6;
        color: #1a1f2e;
    }
    .sticky-cb__close:focus-visible {
        outline: 2px solid var(--color-nav-accent, #c44100);
        outline-offset: 2px;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
        .sticky-cb__fab-wrap,
        .sticky-cb__backdrop,
        .sticky-cb__popover,
        .sticky-cb__fly,
        .sticky-cb__fly-headline,
        .sticky-cb__fly-pill { animation: none; }
        .sticky-cb__fab-pulse { animation: none; display: none; }
        .sticky-cb__fab:hover { transform: none; }
    }
</style>
