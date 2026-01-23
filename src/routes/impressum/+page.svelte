<script lang="ts">
    // Impressum - Legal information page
</script>

<svelte:head>
    <title>Impressum | Aust Umzüge Hildesheim</title>
    <meta
        name="description"
        content="Impressum und rechtliche Informationen von Aust Umzüge und Haushaltsauflösungen in Hildesheim."
    />
</svelte:head>

<main class="impressum">
    <div class="impressum__container">
        <h1 class="impressum__heading">Impressum</h1>

        <section class="impressum__section">
            <h2>Firmenname</h2>
            <p>Aust Umzüge und Haushaltsauflösungen</p>
        </section>

        <section class="impressum__section">
            <h2>Ansprechpartner</h2>
            <p>Alex Aust</p>
        </section>

        <section class="impressum__section">
            <h2>Anschrift</h2>
            <p>Kaiserstr. 32, 31134 Hildesheim</p>
        </section>

        <section class="impressum__section">
            <h2>Umsatzsteuer Identifikationsnummer</h2>
            <p>DE330779170</p>
        </section>

        <section class="impressum__section">
            <h2>Telefon</h2>
            <p><a href="tel:+4951217558379">05121 – 7558379</a></p>
        </section>

        <section class="impressum__section">
            <h2>Internet</h2>
            <p>
                <a
                    href="https://www.aust-umzuege.de/"
                    target="_blank"
                    rel="noopener noreferrer">https://www.aust-umzuege.de/</a
                >
            </p>
        </section>

        <hr class="impressum__divider" />

        <section class="impressum__section">
            <h2>Haftungsausschluss (Disclaimer)</h2>

            <h3>Haftung für Inhalte</h3>
            <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene
                Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
                verantwortlich. Nach § 8 bis 10 TMG sind wir als Diensteanbieter
                jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                Informationen zu überwachen oder nach Umständen zu forschen, die
                auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur
                Entfernung oder Sperrung der Nutzung von Informationen nach den
                allgemeinen Gesetzen bleiben hiervon unberührt. Eine
                diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
                Kenntnis einer konkreten Rechtsverletzung möglich. Bei
                Bekanntwerden von entsprechenden Rechtsverletzungen werden wir
                diese Inhalte umgehend entfernen.
            </p>

            <h3>Haftung für Links</h3>
            <p>
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf
                deren Inhalte wir keinen Einfluss haben. Deshalb können wir für
                diese fremden Inhalte auch keine Gewähr übernehmen. Für die
                Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
                oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten
                wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
                überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der
                Verlinkung nicht erkennbar. Eine permanente inhaltliche
                Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
                Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
                Bekanntwerden von Rechtsverletzungen werden wir derartige Links
                umgehend entfernen.
            </p>

            <h3>Urheberrecht</h3>
            <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
                diesen Seiten unterliegen dem deutschen Urheberrecht. Die
                Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
                Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
                schriftlichen Zustimmung des jeweiligen Autors oder Erstellers.
                Downloads und Kopien dieser Seite sind nur für den privaten,
                nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf
                dieser Seite nicht vom Betreiber erstellt wurden, werden die
                Urheberrechte Dritter beachtet. Insbesondere werden Inhalte
                Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine
                Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
                entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
                werden wir derartige Inhalte umgehend entfernen.
            </p>
        </section>

        <section class="impressum__section">
            <h2>Online-Streitbeilegung gemäß Art. 14 Abs. 1 ODR-VO</h2>
            <p>
                Die Europäische Kommission stellt eine Plattform zur
                Online-Streitbeilegung (OS) bereit, die Sie unter <a
                    href="https://ec.europa.eu/consumers/odr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    >https://ec.europa.eu/consumers/odr/</a
                > finden. Darüber hinaus nimmt unser Betrieb an einem Verbraucherstreitigkeit-verfahren
                nicht teil.
            </p>
        </section>

        <section class="impressum__section">
            <p>
                Bitte beachten Sie auch unsere <a href="/datenschutz"
                    >Datenschutzerklärung</a
                >.
            </p>
        </section>
    </div>
</main>

<style>
    .impressum {
        padding-block: var(--space-16);
        background-color: var(--color-text);
        min-height: 60vh;
    }

    .impressum__container {
        max-width: 800px;
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .impressum__heading {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
        font-weight: var(--font-bold);
        margin: 0 0 var(--space-10);
        position: relative;
        padding-bottom: var(--space-4);
    }

    .impressum__heading::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: 0;
        width: 80px;
        height: 4px;
        background: linear-gradient(90deg, var(--color-nav-accent), #ff8a3d);
        border-radius: var(--radius-full);
    }

    .impressum__section {
        margin-bottom: var(--space-8);
    }

    .impressum__section h2 {
        color: var(--color-info-bar);
        font-size: var(--text-lg);
        font-weight: var(--font-semibold);
        margin: 0 0 var(--space-2);
    }

    .impressum__section h3 {
        color: var(--color-info-bar);
        font-size: var(--text-base);
        font-weight: var(--font-semibold);
        margin: var(--space-6) 0 var(--space-2);
    }

    .impressum__section p {
        color: #4a5568;
        font-size: var(--text-base);
        line-height: 1.75;
        margin: 0;
    }

    .impressum__section a {
        color: var(--color-nav-accent);
        text-decoration: none;
        transition: color var(--transition-fast);
    }

    .impressum__section a:hover {
        color: #d84a00;
        text-decoration: underline;
    }

    .impressum__divider {
        border: none;
        height: 1px;
        background-color: #e2e8f0;
        margin: var(--space-10) 0;
    }

    @media (max-width: 767px) {
        .impressum {
            padding-block: var(--space-10);
        }

        .impressum__section {
            margin-bottom: var(--space-6);
        }
    }
</style>
