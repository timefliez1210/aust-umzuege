<script lang="ts">
    import { Truck, Briefcase, MapPin, Star } from "lucide-svelte";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type IconComponent = any;
    interface TrustSignal {
        number: string;
        label: string;
        icon: IconComponent;
    }

    interface Props {
        signals?: TrustSignal[];
    }

    let {
        signals = [
            { number: "Über 1.200", label: "Umzüge, Haushaltsauflösungen & Entrümpelungen", icon: Truck },
            { number: "Über 230", label: "Geschäftsbeziehungen", icon: Briefcase },
            { number: "Über 7", label: "Jahre lokal in Hildesheim", icon: MapPin },
            { number: "Über 70", label: "5-Sterne-Bewertungen auf Google", icon: Star },
        ],
    }: Props = $props();
</script>

<section class="trust" aria-label="Aust Umzüge in Zahlen">
    <div class="trust__grid">
        {#each signals as signal (signal.label)}
            {@const Icon = signal.icon}
            <div class="stat">
                <span class="stat__icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={2.25} />
                </span>
                <div class="stat__text">
                    <strong class="stat__number">{signal.number}</strong>
                    <span class="stat__label">{signal.label}</span>
                </div>
            </div>
        {/each}
    </div>
</section>

<style>
    .trust {
        --trust-navy: #1e3a5f;
        --trust-orange: var(--color-nav-accent, #ff6b00);
        --trust-mute: #5b6478;
        --trust-line: #e6e8ed;
        --trust-card: #ffffff;
        --trust-surface: #fafafa;

        background: var(--trust-surface);
        padding: 0 1.5rem 3rem;
    }
    @media (min-width: 768px) {
        .trust { padding: 0 2rem 4rem; }
    }

    .trust__grid {
        max-width: var(--container-max, 1440px);
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
    }

    .stat {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        background: var(--trust-card);
        border: 1px solid var(--trust-line);
        border-left: 3px solid var(--trust-orange);
        border-radius: 0.6rem;
        padding: 0.85rem 1rem;
        box-shadow: 0 1px 2px rgba(20, 40, 63, 0.04);
    }

    .stat__icon {
        flex-shrink: 0;
        width: 2.1rem;
        height: 2.1rem;
        border-radius: 0.5rem;
        background: rgba(196, 65, 0, 0.1);
        color: var(--trust-orange);
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .stat__text {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        min-width: 0;
    }

    .stat__number {
        font-size: 1rem;
        font-weight: 800;
        color: var(--trust-navy);
        letter-spacing: -0.01em;
        line-height: 1.2;
    }

    .stat__label {
        font-size: 0.78rem;
        color: var(--trust-mute);
        line-height: 1.3;
    }

    @media (max-width: 1023px) {
        .trust__grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 540px) {
        .trust__grid { grid-template-columns: 1fr; }
    }
</style>
