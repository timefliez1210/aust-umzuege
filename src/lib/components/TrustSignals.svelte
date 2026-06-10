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

        background: #1e3a5f;
        padding: 3rem 1.5rem;
    }
    @media (min-width: 768px) {
        .trust { padding: 4rem 2rem; }
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
        background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-top: 1px solid rgba(255, 255, 255, 0.4);
        border-left: 3px solid var(--trust-orange);
        border-radius: 0.6rem;
        padding: 0.85rem 1rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.3);
        transition: box-shadow 0.2s, background 0.2s;
    }

    .stat:hover {
        background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.4);
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
        color: #ffffff;
        letter-spacing: -0.01em;
        line-height: 1.2;
    }

    .stat__label {
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.3;
    }

    @media (max-width: 1023px) {
        .trust__grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 540px) {
        .trust__grid { grid-template-columns: 1fr; }
    }
</style>
