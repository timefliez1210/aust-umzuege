<script lang="ts">
    import { Package, ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
    <title>Verpackungstipps | Aust Umzüge Ratgeber</title>
    <meta
        name="description"
        content="Professionelle Verpackungstipps für Ihren Umzug."
    />
</svelte:head>

<main class="guide-detail">
    <div class="guide-detail__container">
        <a href="/ratgeber" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <article class="guide-article">
            <header class="guide-header">
                <div class="icon-wrapper">
                    <Package size={48} strokeWidth={1.5} />
                </div>
                <h1>Verpackungstipps vom Profi</h1>
                <p class="subtitle">Sicher verpackt ist halb umgezogen</p>
            </header>

            <div class="guide-content">
                <div class="placeholder-box">
                    <p>
                        Hier finden Sie in Kürze wertvolle Tipps zum sicheren
                        Verpacken Ihres Hausrats.
                    </p>
                    <p>
                        Wir arbeiten gerade an diesen Inhalten, um Ihnen den
                        bestmöglichen Service zu bieten.
                    </p>
                </div>
            </div>
        </article>
    </div>
</main>

<style>
    .guide-detail {
        padding-block: var(--space-12);
        background-color: #fff;
    }

    .guide-detail__container {
        max-width: 800px;
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: #64748b;
        text-decoration: none;
        margin-bottom: var(--space-8);
        font-size: var(--text-sm);
    }

    .back-link:hover {
        color: var(--color-nav-accent);
    }

    .guide-header {
        text-align: center;
        margin-bottom: var(--space-10);
    }

    .icon-wrapper {
        display: inline-flex;
        padding: var(--space-4);
        background-color: #f0f9ff;
        color: var(--color-info-bar);
        border-radius: var(--radius-full);
        margin-bottom: var(--space-4);
    }

    h1 {
        font-size: clamp(2rem, 4vw, 3rem);
        color: var(--color-info-bar);
        font-weight: 700;
        margin-bottom: var(--space-2);
    }

    .subtitle {
        font-size: 1.25rem;
        color: #64748b;
    }

    .placeholder-box {
        background-color: #f8fafc;
        border: 1px dashed #cbd5e0;
        border-radius: var(--radius-lg);
        padding: var(--space-12);
        text-align: center;
        color: #4a5568;
    }
</style>
