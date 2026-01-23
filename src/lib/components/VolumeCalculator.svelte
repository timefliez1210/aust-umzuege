<script lang="ts">
    // VolumeCalculator - Two-panel volume calculator with room categories and items
    import {
        Sofa,
        UtensilsCrossed,
        WashingMachine,
        Bed,
        Briefcase,
        Car,
        Package,
        CornerUpLeft,
        Search,
        Plus,
        Minus,
    } from "lucide-svelte";

    interface Item {
        name: string;
        quantity: number;
        volumePerUnit: number;
    }

    interface Category {
        name: string;
        icon: typeof Sofa;
        items: Item[];
    }

    // Initial categories with all items from the original system
    const initialCategories: Category[] = [
        {
            name: "Wohnzimmer",
            icon: Sofa,
            items: [
                { name: "2-Sitzer Sofa", quantity: 0, volumePerUnit: 0.6 },
                { name: "3-Sitzer Sofa", quantity: 0, volumePerUnit: 0.8 },
                { name: "Beistelltisch", quantity: 0, volumePerUnit: 0.3 },
                { name: "Buffetschrank", quantity: 0, volumePerUnit: 0.8 },
                { name: "Ecksofa", quantity: 0, volumePerUnit: 1.2 },
                {
                    name: "Elektrogeräte (z.B. Stereoanlage)",
                    quantity: 0,
                    volumePerUnit: 0.2,
                },
                { name: "Fernseher", quantity: 0, volumePerUnit: 0.3 },
                {
                    name: "Fernsehkommode (Lowboard)",
                    quantity: 0,
                    volumePerUnit: 0.5,
                },
                { name: "Flügel", quantity: 0, volumePerUnit: 1.0 },
                { name: "Heimorgel", quantity: 0, volumePerUnit: 0.8 },
                { name: "Klavier", quantity: 0, volumePerUnit: 1.2 },
                {
                    name: "Sessel mit Armlehnen",
                    quantity: 0,
                    volumePerUnit: 0.5,
                },
                {
                    name: "Sessel ohne Armlehnen",
                    quantity: 0,
                    volumePerUnit: 0.4,
                },
                { name: "Sideboard groß", quantity: 0, volumePerUnit: 0.9 },
                { name: "Sideboard klein", quantity: 0, volumePerUnit: 0.7 },
                { name: "Stehlampe", quantity: 0, volumePerUnit: 0.3 },
                { name: "Stereoanlage", quantity: 0, volumePerUnit: 0.2 },
                { name: "Stuhl", quantity: 0, volumePerUnit: 0.2 },
                { name: "Teppich", quantity: 0, volumePerUnit: 0.5 },
                { name: "Couchtisch", quantity: 0, volumePerUnit: 0.4 },
                {
                    name: "Wohnzimmerschrank (pro Meter)",
                    quantity: 0,
                    volumePerUnit: 0.4,
                },
                {
                    name: "Umzugskarton (gepackt)",
                    quantity: 0,
                    volumePerUnit: 0.1,
                },
            ],
        },
        {
            name: "Küche/Esszimmer",
            icon: UtensilsCrossed,
            items: [
                { name: "Kühlschrank", quantity: 0, volumePerUnit: 0.8 },
                { name: "Gefrierschrank", quantity: 0, volumePerUnit: 0.7 },
                {
                    name: "Geschirrspülmaschine",
                    quantity: 0,
                    volumePerUnit: 0.7,
                },
                { name: "Herd", quantity: 0, volumePerUnit: 0.6 },
                { name: "Mikrowelle", quantity: 0, volumePerUnit: 0.2 },
                {
                    name: "Küchenoberschrank (pro Tür)",
                    quantity: 0,
                    volumePerUnit: 0.15,
                },
                {
                    name: "Küchenunterschrank (pro Tür)",
                    quantity: 0,
                    volumePerUnit: 0.15,
                },
                { name: "Esstisch bis 1,2m", quantity: 0, volumePerUnit: 0.7 },
                { name: "Esstisch über 1,2m", quantity: 0, volumePerUnit: 0.9 },
                { name: "Esszimmerstuhl", quantity: 0, volumePerUnit: 0.2 },
                { name: "Eckbank (je Sitz)", quantity: 0, volumePerUnit: 0.3 },
                {
                    name: "Vitrine (Glasschrank)",
                    quantity: 0,
                    volumePerUnit: 0.8,
                },
                { name: "Sideboard", quantity: 0, volumePerUnit: 0.7 },
                {
                    name: "Umzugskarton (gepackt)",
                    quantity: 0,
                    volumePerUnit: 0.1,
                },
            ],
        },
        {
            name: "Waschraum",
            icon: WashingMachine,
            items: [
                { name: "Waschmaschine", quantity: 0, volumePerUnit: 0.8 },
                { name: "Trockner", quantity: 0, volumePerUnit: 0.8 },
                { name: "Wäschekorb", quantity: 0, volumePerUnit: 0.2 },
                { name: "Wäscheständer", quantity: 0, volumePerUnit: 0.3 },
                { name: "Bügelbrett", quantity: 0, volumePerUnit: 0.3 },
                { name: "Regal", quantity: 0, volumePerUnit: 0.5 },
                { name: "Toilettenschrank", quantity: 0, volumePerUnit: 0.3 },
                { name: "Badezimmerschrank", quantity: 0, volumePerUnit: 0.4 },
            ],
        },
        {
            name: "Schlafzimmer",
            icon: Bed,
            items: [
                {
                    name: "Einzelbett komplett",
                    quantity: 0,
                    volumePerUnit: 0.9,
                },
                {
                    name: "Doppelbett komplett",
                    quantity: 0,
                    volumePerUnit: 1.2,
                },
                {
                    name: "Kleiderschrank (pro Meter)",
                    quantity: 0,
                    volumePerUnit: 0.4,
                },
                { name: "Kommode", quantity: 0, volumePerUnit: 0.5 },
                { name: "Nachttisch", quantity: 0, volumePerUnit: 0.3 },
                { name: "Frisierkommode", quantity: 0, volumePerUnit: 0.7 },
                { name: "Spiegel", quantity: 0, volumePerUnit: 0.2 },
                { name: "Fernseher", quantity: 0, volumePerUnit: 0.3 },
                { name: "TV-Schrank", quantity: 0, volumePerUnit: 0.5 },
                { name: "Teppich", quantity: 0, volumePerUnit: 0.5 },
                {
                    name: "Umzugskarton (gepackt)",
                    quantity: 0,
                    volumePerUnit: 0.1,
                },
            ],
        },
        {
            name: "Arbeitszimmer",
            icon: Briefcase,
            items: [
                {
                    name: "Schreibtisch bis 1,6m",
                    quantity: 0,
                    volumePerUnit: 0.6,
                },
                {
                    name: "Schreibtisch über 1,6m",
                    quantity: 0,
                    volumePerUnit: 0.8,
                },
                { name: "Bürostuhl", quantity: 0, volumePerUnit: 0.4 },
                { name: "Aktenschrank", quantity: 0, volumePerUnit: 0.5 },
                {
                    name: "Bücherregal (pro Meter)",
                    quantity: 0,
                    volumePerUnit: 0.5,
                },
                { name: "Computer/PC", quantity: 0, volumePerUnit: 0.3 },
                { name: "Drucker", quantity: 0, volumePerUnit: 0.2 },
                { name: "Monitor", quantity: 0, volumePerUnit: 0.15 },
                { name: "Stehlampe", quantity: 0, volumePerUnit: 0.3 },
                {
                    name: "Umzugskarton (gepackt)",
                    quantity: 0,
                    volumePerUnit: 0.1,
                },
            ],
        },
        {
            name: "Garage/Garten",
            icon: Car,
            items: [
                { name: "Fahrrad", quantity: 0, volumePerUnit: 0.5 },
                { name: "Motorrad", quantity: 0, volumePerUnit: 1.0 },
                { name: "Autoreifen (Satz)", quantity: 0, volumePerUnit: 0.5 },
                { name: "Rasenmäher", quantity: 0, volumePerUnit: 0.6 },
                { name: "Gartengeräte", quantity: 0, volumePerUnit: 0.6 },
                { name: "Gartentisch", quantity: 0, volumePerUnit: 0.7 },
                { name: "Gartenstuhl", quantity: 0, volumePerUnit: 0.3 },
                { name: "Sonnenschirm", quantity: 0, volumePerUnit: 0.3 },
                { name: "Grill", quantity: 0, volumePerUnit: 0.7 },
                { name: "Werkzeugschrank", quantity: 0, volumePerUnit: 0.7 },
                { name: "Leiter", quantity: 0, volumePerUnit: 0.3 },
            ],
        },
        {
            name: "Sonstiges",
            icon: Package,
            items: [
                { name: "Kinderwagen", quantity: 0, volumePerUnit: 0.5 },
                { name: "Kinderbett", quantity: 0, volumePerUnit: 0.9 },
                { name: "Wickelkommode", quantity: 0, volumePerUnit: 0.6 },
                { name: "Spielzeugkiste", quantity: 0, volumePerUnit: 0.4 },
                { name: "Staubsauger", quantity: 0, volumePerUnit: 0.5 },
                { name: "Koffer", quantity: 0, volumePerUnit: 0.2 },
                { name: "Sportgeräte", quantity: 0, volumePerUnit: 0.5 },
                { name: "Tischtennisplatte", quantity: 0, volumePerUnit: 1.2 },
                { name: "Heimtrainer", quantity: 0, volumePerUnit: 0.8 },
                { name: "Aquarium", quantity: 0, volumePerUnit: 0.6 },
            ],
        },
        {
            name: "Gang/Flur",
            icon: CornerUpLeft,
            items: [
                { name: "Garderobe", quantity: 0, volumePerUnit: 0.5 },
                { name: "Schuhschrank", quantity: 0, volumePerUnit: 0.4 },
                { name: "Spiegel", quantity: 0, volumePerUnit: 0.2 },
                { name: "Kleiderständer", quantity: 0, volumePerUnit: 0.3 },
                {
                    name: "Konsole/Beistelltisch",
                    quantity: 0,
                    volumePerUnit: 0.3,
                },
                { name: "Deckenlampe", quantity: 0, volumePerUnit: 0.05 },
                { name: "Teppich/Läufer", quantity: 0, volumePerUnit: 0.3 },
            ],
        },
    ];

    // State
    let categories = $state<Category[]>(
        JSON.parse(JSON.stringify(initialCategories)),
    );
    let activeCategoryIndex = $state(0);
    let searchQuery = $state("");

    // Derived
    const activeCategory = $derived(categories[activeCategoryIndex]);
    const totalVolume = $derived(
        categories.reduce(
            (total, cat) =>
                total +
                cat.items.reduce(
                    (catTotal, item) =>
                        catTotal + item.quantity * item.volumePerUnit,
                    0,
                ),
            0,
        ),
    );

    const searchResults = $derived(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return [];
        const results: { catIndex: number; itemIndex: number; item: Item }[] =
            [];
        categories.forEach((cat, catIndex) => {
            cat.items.forEach((item, itemIndex) => {
                if (item.name.toLowerCase().includes(query)) {
                    results.push({ catIndex, itemIndex, item });
                }
            });
        });
        return results;
    });

    // Actions
    function selectCategory(index: number) {
        activeCategoryIndex = index;
        searchQuery = "";
    }

    function increment(catIndex: number, itemIndex: number) {
        categories[catIndex].items[itemIndex].quantity++;
    }

    function decrement(catIndex: number, itemIndex: number) {
        if (categories[catIndex].items[itemIndex].quantity > 0) {
            categories[catIndex].items[itemIndex].quantity--;
        }
    }
</script>

<div class="volume-calculator">
    <div class="volume-calculator__info">
        <p>
            <strong>Beispiel:</strong> Ihr Sofa ist 2m lang, 1m breit und 1,20m hoch.
            Sie rechnen also 2 × 1 × 1,20 = 2,4 m³.
        </p>
    </div>

    <div class="volume-calculator__layout">
        <!-- Left Sidebar: Categories -->
        <aside class="volume-calculator__sidebar">
            {#each categories as category, index}
                <button
                    class="volume-calculator__category"
                    class:active={activeCategoryIndex === index && !searchQuery}
                    onclick={() => selectCategory(index)}
                >
                    <span class="volume-calculator__category-icon">
                        {#if category.name === "Wohnzimmer"}
                            <Sofa size={20} />
                        {:else if category.name === "Küche/Esszimmer"}
                            <UtensilsCrossed size={20} />
                        {:else if category.name === "Waschraum"}
                            <WashingMachine size={20} />
                        {:else if category.name === "Schlafzimmer"}
                            <Bed size={20} />
                        {:else if category.name === "Arbeitszimmer"}
                            <Briefcase size={20} />
                        {:else if category.name === "Garage/Garten"}
                            <Car size={20} />
                        {:else if category.name === "Sonstiges"}
                            <Package size={20} />
                        {:else if category.name === "Gang/Flur"}
                            <CornerUpLeft size={20} />
                        {/if}
                    </span>
                    <span class="volume-calculator__category-name"
                        >{category.name}</span
                    >
                </button>
            {/each}
        </aside>

        <!-- Right Panel: Items -->
        <div class="volume-calculator__items-panel">
            {#if searchQuery.trim()}
                <!-- Search Results -->
                {#if searchResults().length > 0}
                    <div class="volume-calculator__items-list">
                        {#each searchResults() as result}
                            <div class="volume-calculator__item">
                                <span class="volume-calculator__item-name"
                                    >{result.item.name}</span
                                >
                                <div class="volume-calculator__item-counter">
                                    {#if categories[result.catIndex].items[result.itemIndex].quantity > 0}
                                        <button
                                            class="volume-calculator__counter-btn volume-calculator__counter-btn--minus"
                                            onclick={() =>
                                                decrement(
                                                    result.catIndex,
                                                    result.itemIndex,
                                                )}
                                            aria-label="Entfernen"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span
                                            class="volume-calculator__counter-value"
                                        >
                                            {categories[result.catIndex].items[
                                                result.itemIndex
                                            ].quantity}
                                        </span>
                                    {/if}
                                    <button
                                        class="volume-calculator__counter-btn volume-calculator__counter-btn--plus"
                                        onclick={() =>
                                            increment(
                                                result.catIndex,
                                                result.itemIndex,
                                            )}
                                        aria-label="Hinzufügen"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="volume-calculator__no-results">
                        Keine Ergebnisse für "{searchQuery}"
                    </p>
                {/if}
            {:else}
                <!-- Category Items -->
                <div class="volume-calculator__items-list">
                    {#each activeCategory.items as item, itemIndex}
                        <div class="volume-calculator__item">
                            <span class="volume-calculator__item-name"
                                >{item.name}</span
                            >
                            <div class="volume-calculator__item-counter">
                                {#if item.quantity > 0}
                                    <button
                                        class="volume-calculator__counter-btn volume-calculator__counter-btn--minus"
                                        onclick={() =>
                                            decrement(
                                                activeCategoryIndex,
                                                itemIndex,
                                            )}
                                        aria-label="Entfernen"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span
                                        class="volume-calculator__counter-value"
                                        >{item.quantity}</span
                                    >
                                {/if}
                                <button
                                    class="volume-calculator__counter-btn volume-calculator__counter-btn--plus"
                                    onclick={() =>
                                        increment(
                                            activeCategoryIndex,
                                            itemIndex,
                                        )}
                                    aria-label="Hinzufügen"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Search Bar -->
            <div class="volume-calculator__search">
                <Search size={18} class="volume-calculator__search-icon" />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Weitere Gegenstände finden"
                    class="volume-calculator__search-input"
                />
            </div>
        </div>
    </div>

    <!-- Volume Display -->
    <div class="volume-calculator__total">
        <p class="volume-calculator__total-label">Geschätztes Umzugsvolumen:</p>
        <p class="volume-calculator__total-value">
            {totalVolume.toFixed(2)} m³
        </p>
    </div>
</div>

<style>
    .volume-calculator {
        background-color: var(--color-text);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-lg);
    }

    .volume-calculator__info {
        background-color: #f0f4ff;
        padding: var(--space-4) var(--space-6);
        border-bottom: 1px solid #e2e8f0;
    }

    .volume-calculator__info p {
        color: var(--color-info-bar);
        font-size: var(--text-sm);
        margin: 0;
    }

    .volume-calculator__info strong {
        color: var(--color-nav-accent);
    }

    .volume-calculator__layout {
        display: grid;
        grid-template-columns: 220px 1fr;
        min-height: 400px;
    }

    /* Sidebar */
    .volume-calculator__sidebar {
        background-color: #f8fafc;
        border-right: 1px solid #e2e8f0;
        padding: var(--space-2);
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    .volume-calculator__category {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background-color: transparent;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
        text-align: left;
        color: #4a5568;
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
    }

    .volume-calculator__category:hover {
        background-color: #edf2f7;
    }

    .volume-calculator__category.active {
        background-color: var(--color-info-bar);
        color: var(--color-text);
    }

    .volume-calculator__category-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background-color: rgba(30, 58, 95, 0.1);
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
    }

    .volume-calculator__category.active .volume-calculator__category-icon {
        background-color: rgba(255, 255, 255, 0.2);
    }

    /* Items Panel */
    .volume-calculator__items-panel {
        display: flex;
        flex-direction: column;
        padding: var(--space-4);
    }

    .volume-calculator__items-list {
        flex: 1;
        overflow-y: auto;
        max-height: 350px;
    }

    .volume-calculator__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3) var(--space-2);
        border-bottom: 1px solid #f0f4f8;
        transition: background-color var(--transition-fast);
    }

    .volume-calculator__item:hover {
        background-color: #fafafa;
    }

    .volume-calculator__item:last-child {
        border-bottom: none;
    }

    .volume-calculator__item-name {
        color: #4a5568;
        font-size: var(--text-sm);
    }

    .volume-calculator__item-counter {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .volume-calculator__counter-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .volume-calculator__counter-btn--plus {
        background-color: var(--color-info-bar);
        color: var(--color-text);
    }

    .volume-calculator__counter-btn--plus:hover {
        background-color: var(--color-nav-accent);
    }

    .volume-calculator__counter-btn--minus {
        background-color: #e2e8f0;
        color: #4a5568;
    }

    .volume-calculator__counter-btn--minus:hover {
        background-color: #cbd5e0;
    }

    .volume-calculator__counter-value {
        min-width: 24px;
        text-align: center;
        font-weight: var(--font-semibold);
        color: var(--color-info-bar);
    }

    .volume-calculator__no-results {
        color: #718096;
        text-align: center;
        padding: var(--space-8);
        font-size: var(--text-sm);
    }

    /* Search */
    .volume-calculator__search {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-md);
        margin-top: var(--space-4);
    }

    .volume-calculator__search :global(.volume-calculator__search-icon) {
        color: #a0aec0;
        flex-shrink: 0;
    }

    .volume-calculator__search-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: var(--text-sm);
        color: #4a5568;
        outline: none;
    }

    .volume-calculator__search-input::placeholder {
        color: #a0aec0;
    }

    /* Total Volume */
    .volume-calculator__total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-5) var(--space-6);
        background-color: var(--color-info-bar);
        color: var(--color-text);
    }

    .volume-calculator__total-label {
        font-size: var(--text-base);
        font-weight: var(--font-medium);
        margin: 0;
        color: var(--color-text);
    }

    .volume-calculator__total-value {
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
        margin: 0;
        color: var(--color-nav-accent);
    }

    /* Mobile Responsive */
    @media (max-width: 767px) {
        .volume-calculator__layout {
            grid-template-columns: 1fr;
        }

        .volume-calculator__sidebar {
            flex-direction: row;
            flex-wrap: wrap;
            gap: var(--space-2);
            padding: var(--space-3);
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
        }

        .volume-calculator__category {
            flex: 0 0 auto;
            padding: var(--space-2) var(--space-3);
            font-size: var(--text-xs);
        }

        .volume-calculator__category-icon {
            width: 24px;
            height: 24px;
        }

        .volume-calculator__category-name {
            display: none;
        }

        .volume-calculator__category.active .volume-calculator__category-name {
            display: inline;
        }

        .volume-calculator__items-list {
            max-height: 300px;
        }

        .volume-calculator__total {
            flex-direction: column;
            text-align: center;
            gap: var(--space-2);
        }
    }
</style>
