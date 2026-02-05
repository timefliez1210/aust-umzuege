<script lang="ts">
    // InfoBar - Top contact information strip
    interface Props {
        phone?: string;
        hours?: string;
    }

    let {
        phone = "05121 - 755 83 79",
        hours = "Montag – Freitag von 09:00 – 19:00 Uhr",
    }: Props = $props();
</script>

<div class="info-bar" role="banner" aria-label="Kontaktinformationen">
    <div class="info-bar__container">
        <p class="info-bar__contact">
            Haben Sie Fragen? Rufen Sie uns gerne an:
            <a href="tel:+4951217558379" class="info-bar__phone" aria-label="Telefon: {phone}">{phone}</a>
        </p>
        <p class="info-bar__hours" aria-label="Öffnungszeiten">{hours}</p>
    </div>
</div>

<style>
    .info-bar {
        background-color: var(--color-info-bar, #1e3a5f);
        padding-block: var(--space-2);
        font-size: var(--text-sm);
    }

    .info-bar__container {
        width: 100%;
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-2);
    }

    .info-bar__contact,
    .info-bar__hours {
        color: var(--color-text);
        margin: 0;
        font-size: var(--text-sm);
    }

    .info-bar__phone {
        color: var(--color-text);
        font-weight: var(--font-medium);
        transition: color var(--transition-fast);
    }

    .info-bar__phone:hover {
        color: var(--color-accent);
    }

    @media (max-width: 767px) {
        .info-bar {
            display: none;
        }
    }
</style>
