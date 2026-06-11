<script lang="ts">
    import { crewPackages, disclaimersByService, type ServiceKey } from "$lib/data/pricing";

    interface Props {
        service: ServiceKey;
        title?: string;
        intro?: string;
        /** Override or extend the default disclaimers for this service */
        disclaimers?: readonly string[];
    }

    let {
        service,
        title = "Komplettpakete – Helfer inkl. LKW",
        intro,
        disclaimers,
    }: Props = $props();

    const notes = $derived(disclaimers ?? disclaimersByService[service]);

    const fmt = (n: number) => new Intl.NumberFormat("de-DE").format(n);
</script>

<section class="price-cards" aria-label={title}>
    <h2 class="price-cards__title">{title}</h2>
    {#if intro}
        <p class="price-cards__intro">{intro}</p>
    {/if}

    <div class="price-cards__grid">
        {#each crewPackages as pkg (pkg.id)}
            <article class="price-card">
                <header class="price-card__header">
                    <div class="price-card__crew" aria-label="{pkg.helpers} Helfer und {pkg.lkw} LKW">
                        <span class="price-card__icons" aria-hidden="true">
                            <span class="price-card__icon-row">
                                {#each Array(pkg.helpers) as _}<span class="price-card__icon">👤</span>{/each}
                            </span>
                            <span class="price-card__icon-row">
                                {#each Array(pkg.lkw) as _}<span class="price-card__icon">🚚</span>{/each}
                            </span>
                        </span>
                        <span class="price-card__crew-text">
                            {pkg.helpers} Helfer · {pkg.lkw} {pkg.lkw === 1 ? "LKW" : "LKWs"}
                        </span>
                    </div>
                    <span class="price-card__tag">{pkg.label}</span>
                </header>

                <p class="price-card__mwst">Alle Preise inkl. MwSt.</p>

                <ul class="price-card__tiers">
                    {#each pkg.tiers as tier}
                        <li class="price-card__tier">
                            <span class="price-card__price">€ <strong>{fmt(tier.price)}</strong></span>
                            <span class="price-card__hours">/ {tier.hours} Std.</span>
                        </li>
                    {/each}
                </ul>

                <footer class="price-card__footer">
                    <span class="price-card__extra-label">Jede weitere Stunde</span>
                    <span class="price-card__extra-value">{pkg.extraHour} €</span>
                </footer>
            </article>
        {/each}
    </div>

    {#if notes && notes.length > 0}
        <ul class="price-cards__notes">
            {#each notes as note, i}
                <li><span class="price-cards__notes-mark">{i + 1}.</span> {note}</li>
            {/each}
        </ul>
    {/if}
</section>

<style>
    .price-cards {
        margin: var(--space-10) 0;
    }
    .price-cards__title {
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        line-height: 1.25;
        margin: 0 0 var(--space-4) 0;
        color: var(--color-info-bar);
    }
    .price-cards__intro {
        margin: 0 0 var(--space-8) 0;
        color: #4a5568;
        font-size: var(--text-lg);
        line-height: 1.7;
    }
    .price-cards__grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-5);
    }
    @media (min-width: 640px) {
        .price-cards__grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 1024px) {
        .price-cards__grid { grid-template-columns: repeat(4, 1fr); }
    }

    .price-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: var(--radius-lg);
        padding: var(--space-5);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .price-card__header {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }
    .price-card__icons {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 1.25rem;
        line-height: 1;
    }
    .price-card__icon-row {
        display: flex;
        align-items: center;
        gap: 0.125rem;
        min-height: 1.25rem;
    }
    .price-card__icon {
        display: inline-flex;
        align-items: center;
    }
    .price-card__crew-text {
        display: block;
        font-size: 0.8125rem;
        color: #4b5563;
    }
    .price-card__tag {
        align-self: flex-start;
        background: #dcfce7;
        color: #14532d;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.625rem;
        border-radius: var(--radius-full);
    }
    .price-card__mwst {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: 0;
    }
    .price-card__tiers {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }
    .price-card__tier {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 0.5rem;
        background: #f9fafb;
        border: 1px solid #f3f4f6;
        border-radius: var(--radius-md);
        padding: 0.5rem 0.75rem;
        font-size: 0.9375rem;
        color: #111827;
    }
    .price-card__price strong {
        font-weight: 700;
    }
    .price-card__hours {
        color: #6b7280;
        font-size: 0.875rem;
    }
    .price-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        margin-top: auto;
        padding-top: var(--space-3);
        border-top: 1px dashed #e5e7eb;
    }
    .price-card__extra-label {
        font-size: 0.875rem;
        color: #4b5563;
        line-height: 1.3;
    }
    .price-card__extra-value {
        background: #eff6ff;
        color: #1e3a5f;
        font-weight: 700;
        padding: 0.375rem 0.875rem;
        border-radius: var(--radius-full);
        font-size: 0.9375rem;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .price-cards__notes {
        list-style: none;
        padding: var(--space-4) var(--space-5);
        margin-top: var(--space-6);
        background: #f9fafb;
        border-left: 4px solid var(--color-nav-accent);
        border-radius: var(--radius-md);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        font-size: 0.875rem;
        color: #374151;
    }
    .price-cards__notes-mark {
        font-weight: 700;
        color: var(--color-nav-accent);
        margin-right: 0.25rem;
    }
</style>
