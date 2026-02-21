<script lang="ts">
    // VolumeCalculator - Two-panel volume calculator with room categories and items
    // RE (Raumeinheit) values from Alltransport 24 Umzüge standard list
    // Conversion: 1 RE = 0.1 m³
    import {
        Sofa,
        UtensilsCrossed,
        ChefHat,
        Bath,
        Bed,
        Briefcase,
        Baby,
        Package,
        Search,
        Plus,
        Minus,
    } from "lucide-svelte";

    interface Item {
        name: string;
        quantity: number;
        volumePerUnit: number; // in m³ (RE * 0.1)
    }

    interface Category {
        name: string;
        icon: typeof Sofa;
        items: Item[];
    }

    interface Props {
        volumeM3?: number;
        itemSummary?: string;
    }

    // Bindable props to expose data to parent
    let { volumeM3 = $bindable(0), itemSummary = $bindable("") }: Props = $props();

    // RE to m³ conversion factor
    const RE_TO_M3 = 0.1;

    // Initial categories with items from Alltransport 24 Umzüge spreadsheet
    const initialCategories: Category[] = [
        {
            name: "Wohnzimmer",
            icon: Sofa,
            items: [
                {
                    name: "Anbauwand b. 38cm Tiefe je angef. m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Anbauwand ü. 38cm Tiefe je angef. m",
                    quantity: 0,
                    volumePerUnit: 10 * RE_TO_M3,
                },
                {
                    name: "Bilder bis 0,8 m",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Bilder über 0,8 m",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                { name: "Brücke", quantity: 0, volumePerUnit: 1 * RE_TO_M3 },
                {
                    name: "Bücherregal zerlegbar je angef. m",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Buffet mit Aufsatz",
                    quantity: 0,
                    volumePerUnit: 18 * RE_TO_M3,
                },
                {
                    name: "Buffet ohne Aufsatz",
                    quantity: 0,
                    volumePerUnit: 15 * RE_TO_M3,
                },
                {
                    name: "Deckenlampe",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                { name: "Fernseher", quantity: 0, volumePerUnit: 3 * RE_TO_M3 },
                { name: "Flügel", quantity: 0, volumePerUnit: 20 * RE_TO_M3 },
                {
                    name: "Heimorgel",
                    quantity: 0,
                    volumePerUnit: 10 * RE_TO_M3,
                },
                { name: "Klavier", quantity: 0, volumePerUnit: 15 * RE_TO_M3 },
                { name: "Lüster", quantity: 0, volumePerUnit: 5 * RE_TO_M3 },
                {
                    name: "Musikschrank / Turm",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Nähmaschine (Schrank)",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Schreibtisch bis 1,6 m",
                    quantity: 0,
                    volumePerUnit: 12 * RE_TO_M3,
                },
                {
                    name: "Schreibtisch über 1,6 m",
                    quantity: 0,
                    volumePerUnit: 17 * RE_TO_M3,
                },
                {
                    name: "Sessel mit Armlehnen",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Sessel ohne Armlehnen",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Sideboard groß",
                    quantity: 0,
                    volumePerUnit: 12 * RE_TO_M3,
                },
                {
                    name: "Sideboard klein",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                {
                    name: "Sitzlandschaft (Element) je Sitz",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Sofa, Couch, Liege je Sitz",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                { name: "Standuhr", quantity: 0, volumePerUnit: 4 * RE_TO_M3 },
                { name: "Stehlampe", quantity: 0, volumePerUnit: 2 * RE_TO_M3 },
                {
                    name: "Stereoanlage",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                { name: "Stuhl", quantity: 0, volumePerUnit: 2 * RE_TO_M3 },
                {
                    name: "Stuhl mit Armlehnen",
                    quantity: 0,
                    volumePerUnit: 3 * RE_TO_M3,
                },
                { name: "Teppich", quantity: 0, volumePerUnit: 3 * RE_TO_M3 },
                {
                    name: "Tisch bis 0,6 m",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,0 m",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,2 m",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                {
                    name: "Tisch über 1,2 m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "TV-Schrank",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Video / DVD-Player",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Wohnzimmerschrank zerlegbar je angef. m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton bis 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton über 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1.5 * RE_TO_M3,
                },
            ],
        },
        {
            name: "Schlafzimmer",
            icon: Bed,
            items: [
                { name: "Bettumbau", quantity: 0, volumePerUnit: 3 * RE_TO_M3 },
                {
                    name: "Bettzeug je Betteinheit",
                    quantity: 0,
                    volumePerUnit: 3 * RE_TO_M3,
                },
                {
                    name: "Bilder bis 0,8 m",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Bilder über 0,8 m",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Deckenlampe",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Doppelbett komplett",
                    quantity: 0,
                    volumePerUnit: 20 * RE_TO_M3,
                },
                {
                    name: "Einzelbett komplett",
                    quantity: 0,
                    volumePerUnit: 10 * RE_TO_M3,
                },
                { name: "Fernseher", quantity: 0, volumePerUnit: 3 * RE_TO_M3 },
                {
                    name: "Französisches Bett komplett",
                    quantity: 0,
                    volumePerUnit: 15 * RE_TO_M3,
                },
                {
                    name: "Schminktisch (mit Spiegel)",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                {
                    name: "Kleiderbehältnis",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                { name: "Kommode", quantity: 0, volumePerUnit: 7 * RE_TO_M3 },
                {
                    name: "Nachttisch",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Schrank bis 2 Türen, nicht zerlegbar",
                    quantity: 0,
                    volumePerUnit: 15 * RE_TO_M3,
                },
                {
                    name: "Schrank zerlegbar je angefang. m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Spiegel über 0,8 m",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Stuhl, Hocker",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                { name: "Teppich", quantity: 0, volumePerUnit: 3 * RE_TO_M3 },
                {
                    name: "TV-Schrank",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Wäschetruhe",
                    quantity: 0,
                    volumePerUnit: 3 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton bis 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton über 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1.5 * RE_TO_M3,
                },
            ],
        },
        {
            name: "Esszimmer",
            icon: UtensilsCrossed,
            items: [
                {
                    name: "Bilder bis 0,8 m",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Bilder über 0,8 m",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                { name: "Brücke", quantity: 0, volumePerUnit: 1 * RE_TO_M3 },
                {
                    name: "Deckenlampe",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Eckbank je Sitz",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                { name: "Hausbar", quantity: 0, volumePerUnit: 5 * RE_TO_M3 },
                { name: "Sekretär", quantity: 0, volumePerUnit: 12 * RE_TO_M3 },
                {
                    name: "Sideboard groß",
                    quantity: 0,
                    volumePerUnit: 12 * RE_TO_M3,
                },
                {
                    name: "Sideboard klein",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                { name: "Stehlampe", quantity: 0, volumePerUnit: 2 * RE_TO_M3 },
                { name: "Stuhl", quantity: 0, volumePerUnit: 2 * RE_TO_M3 },
                {
                    name: "Stuhl mit Armlehnen",
                    quantity: 0,
                    volumePerUnit: 3 * RE_TO_M3,
                },
                {
                    name: "Teewagen (nicht zerlegbar)",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                { name: "Teppich", quantity: 0, volumePerUnit: 3 * RE_TO_M3 },
                {
                    name: "Tisch bis 0,6 m",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,0 m",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,2 m",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                {
                    name: "Tisch über 1,2 m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Vitrine (Glasschrank)",
                    quantity: 0,
                    volumePerUnit: 10 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton bis 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton über 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1.5 * RE_TO_M3,
                },
            ],
        },
        {
            name: "Küche",
            icon: ChefHat,
            items: [
                {
                    name: "Arbeitsplatte nicht unterb. je angef. m",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Besenschrank",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                {
                    name: "Buffet mit Aufsätzen",
                    quantity: 0,
                    volumePerUnit: 18 * RE_TO_M3,
                },
                {
                    name: "Deckenlampe",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Eckbank je Sitz",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Geschirrspülmaschine",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                { name: "Herd", quantity: 0, volumePerUnit: 5 * RE_TO_M3 },
                {
                    name: "Kühlschrank / Truhe bis 120 l",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Kühlschrank / Truhe über 120 l",
                    quantity: 0,
                    volumePerUnit: 10 * RE_TO_M3,
                },
                {
                    name: "Mikrowelle",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Oberteil je Tür",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                { name: "Stuhl", quantity: 0, volumePerUnit: 2 * RE_TO_M3 },
                { name: "Teppich", quantity: 0, volumePerUnit: 3 * RE_TO_M3 },
                {
                    name: "Tisch bis 0,6 m",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,0 m",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,2 m",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                {
                    name: "Tisch über 1,2 m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Küchenunterschrank",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Waschmaschine / Trockner",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton bis 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton über 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1.5 * RE_TO_M3,
                },
            ],
        },
        {
            name: "Kinderzimmer",
            icon: Baby,
            items: [
                {
                    name: "Anbauwand b. 38cm Tiefe je ang. m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Anbauwand ü. 38cm Tiefe je ang. m",
                    quantity: 0,
                    volumePerUnit: 10 * RE_TO_M3,
                },
                {
                    name: "Bett komplett",
                    quantity: 0,
                    volumePerUnit: 10 * RE_TO_M3,
                },
                {
                    name: "Bettzeug je Betteinheit",
                    quantity: 0,
                    volumePerUnit: 3 * RE_TO_M3,
                },
                { name: "Brücke", quantity: 0, volumePerUnit: 1 * RE_TO_M3 },
                {
                    name: "Deckenlampe",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Etagenbett komplett",
                    quantity: 0,
                    volumePerUnit: 16 * RE_TO_M3,
                },
                {
                    name: "Kinderbett komplett",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Kleiderbehältnis",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                { name: "Kommode", quantity: 0, volumePerUnit: 7 * RE_TO_M3 },
                {
                    name: "Laufgitter",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Nachttisch",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Schrank bis 2 Türen nicht zerlegbar",
                    quantity: 0,
                    volumePerUnit: 15 * RE_TO_M3,
                },
                {
                    name: "Schrank zerlegbar je angef. m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Schreibpult",
                    quantity: 0,
                    volumePerUnit: 7 * RE_TO_M3,
                },
                {
                    name: "Spielzeugkiste",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Stuhl, Hocker",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                { name: "Teppich", quantity: 0, volumePerUnit: 3 * RE_TO_M3 },
                {
                    name: "Tisch bis 0,6 m",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,0 m",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,2 m",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                {
                    name: "Tisch über 1,2 m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton bis 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton über 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1.5 * RE_TO_M3,
                },
            ],
        },
        {
            name: "Arbeitszimmer",
            icon: Briefcase,
            items: [
                {
                    name: "Aktenschrank je angefangener m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                { name: "Brücke", quantity: 0, volumePerUnit: 1 * RE_TO_M3 },
                {
                    name: "Bücherregal zerlegbar je angef. m",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Computer: PC / EDV-Anlage",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Deckenlampe",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Schreibtisch bis 1,6 m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Schreibtisch über 1,6 m",
                    quantity: 0,
                    volumePerUnit: 12 * RE_TO_M3,
                },
                {
                    name: "Schreibtischcontainer",
                    quantity: 0,
                    volumePerUnit: 3 * RE_TO_M3,
                },
                {
                    name: "Schreibtischstuhl",
                    quantity: 0,
                    volumePerUnit: 3 * RE_TO_M3,
                },
                {
                    name: "Sessel mit Armlehnen",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Sessel ohne Armlehnen",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                { name: "Stehlampe", quantity: 0, volumePerUnit: 2 * RE_TO_M3 },
                { name: "Teppich", quantity: 0, volumePerUnit: 3 * RE_TO_M3 },
                {
                    name: "Tisch bis 0,6 m",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,0 m",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Tisch bis 1,2 m",
                    quantity: 0,
                    volumePerUnit: 6 * RE_TO_M3,
                },
                {
                    name: "Tisch über 1,2 m",
                    quantity: 0,
                    volumePerUnit: 8 * RE_TO_M3,
                },
                {
                    name: "Tischkopierer",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Winkelkombination",
                    quantity: 0,
                    volumePerUnit: 12 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton bis 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton über 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1.5 * RE_TO_M3,
                },
            ],
        },
        {
            name: "Bad",
            icon: Bath,
            items: [
                {
                    name: "Deckenlampe",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Kleiderablage",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Stuhl, Hocker",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Toilettenschrank",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Truhe, Kommode",
                    quantity: 0,
                    volumePerUnit: 7 * RE_TO_M3,
                },
                {
                    name: "Wäschekorb",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton bis 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton über 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1.5 * RE_TO_M3,
                },
            ],
        },
        {
            name: "Sonstiges",
            icon: Package,
            items: [
                {
                    name: "Autoreifen",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Blumenkübel / Kasten",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Bügelbrett",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Dreirad / Kinderrad",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Fahrrad / Moped",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Gartengeräte",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Gartengrill",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                {
                    name: "Kinderwagen",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Klapptisch / Klappstuhl",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                { name: "Koffer", quantity: 0, volumePerUnit: 1 * RE_TO_M3 },
                {
                    name: "Leiter je angefangener m",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                { name: "Motorrad", quantity: 0, volumePerUnit: 8 * RE_TO_M3 },
                { name: "Mülltonne", quantity: 0, volumePerUnit: 2 * RE_TO_M3 },
                {
                    name: "Rasenmäher Hand",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Rasenmäher Motor",
                    quantity: 0,
                    volumePerUnit: 5 * RE_TO_M3,
                },
                {
                    name: "Regal zerlegbar je angef. m",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                { name: "Schlitten", quantity: 0, volumePerUnit: 2 * RE_TO_M3 },
                {
                    name: "Schubkarre",
                    quantity: 0,
                    volumePerUnit: 4 * RE_TO_M3,
                },
                { name: "Ski", quantity: 0, volumePerUnit: 2 * RE_TO_M3 },
                {
                    name: "Sonnenbank",
                    quantity: 0,
                    volumePerUnit: 10 * RE_TO_M3,
                },
                {
                    name: "Sonnenschirm",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Staubsauger",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Tischtennisplatte",
                    quantity: 0,
                    volumePerUnit: 3 * RE_TO_M3,
                },
                {
                    name: "Werkzeugkoffer",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Werkzeugschrank",
                    quantity: 0,
                    volumePerUnit: 2 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton bis 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1 * RE_TO_M3,
                },
                {
                    name: "Umzugskarton über 80 l (gepackt)",
                    quantity: 0,
                    volumePerUnit: 1.5 * RE_TO_M3,
                },
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

    // Generate item summary for form submission
    const selectedItemsSummary = $derived(() => {
        const items: string[] = [];
        categories.forEach((cat) => {
            cat.items.forEach((item) => {
                if (item.quantity > 0) {
                    items.push(`${item.quantity}x ${item.name} (${(item.quantity * item.volumePerUnit).toFixed(2)} m³)`);
                }
            });
        });
        return items.join("\n");
    });

    // Update bindable props when values change
    $effect(() => {
        volumeM3 = totalVolume;
        itemSummary = selectedItemsSummary();
    });

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

    function setQuantity(catIndex: number, itemIndex: number, value: string) {
        const qty = Math.max(0, Math.floor(parseInt(value, 10) || 0));
        categories[catIndex].items[itemIndex].quantity = qty;
    }
</script>

<div class="volume-calculator">
    <div class="volume-calculator__info">
        <p>
            <strong>Hinweis:</strong> Wählen Sie Ihre Gegenstände aus den Kategorien
            aus. Das Volumen wird automatisch in m³ berechnet.
        </p>
    </div>

    <div class="volume-calculator__layout">
        <!-- Left Sidebar: Categories -->
        <aside class="volume-calculator__sidebar">
            {#each categories as category, index}
                <button
                    type="button"
                    class="volume-calculator__category"
                    class:active={activeCategoryIndex === index && !searchQuery}
                    onclick={() => selectCategory(index)}
                >
                    <span class="volume-calculator__category-icon">
                        {#if category.name === "Wohnzimmer"}
                            <Sofa size={20} />
                        {:else if category.name === "Schlafzimmer"}
                            <Bed size={20} />
                        {:else if category.name === "Esszimmer"}
                            <UtensilsCrossed size={20} />
                        {:else if category.name === "Küche"}
                            <UtensilsCrossed size={20} />
                        {:else if category.name === "Kinderzimmer"}
                            <Baby size={20} />
                        {:else if category.name === "Arbeitszimmer"}
                            <Briefcase size={20} />
                        {:else if category.name === "Bad"}
                            <Bath size={20} />
                        {:else if category.name === "Sonstiges"}
                            <Package size={20} />
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
                                            type="button"
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
                                        <input
                                            type="number"
                                            class="volume-calculator__counter-value"
                                            value={categories[result.catIndex].items[result.itemIndex].quantity}
                                            min="0"
                                            aria-label="Anzahl"
                                            oninput={(e) => setQuantity(result.catIndex, result.itemIndex, (e.target as HTMLInputElement).value)}
                                            onclick={(e) => (e.target as HTMLInputElement).select()}
                                        />
                                    {/if}
                                    <button
                                        type="button"
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
                                        type="button"
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
                                    <input
                                        type="number"
                                        class="volume-calculator__counter-value"
                                        value={item.quantity}
                                        min="0"
                                        aria-label="Anzahl"
                                        oninput={(e) => setQuantity(activeCategoryIndex, itemIndex, (e.target as HTMLInputElement).value)}
                                        onclick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                {/if}
                                <button
                                    type="button"
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
        min-width: 0; /* Allow grid item to shrink below min-content */
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
        min-width: 0; /* Allow grid item to shrink below min-content */
        overflow: hidden; /* Contain any inner overflow */
    }

    .volume-calculator__items-list {
        flex: 1;
        overflow-y: auto;
        max-height: 350px;
    }

    /* Custom scrollbar - always visible */
    .volume-calculator__items-list::-webkit-scrollbar {
        width: 8px;
    }

    .volume-calculator__items-list::-webkit-scrollbar-track {
        background: #e2e8f0;
        border-radius: 4px;
    }

    .volume-calculator__items-list::-webkit-scrollbar-thumb {
        background: #94a3b8;
        border-radius: 4px;
    }

    .volume-calculator__items-list::-webkit-scrollbar-thumb:hover {
        background: #64748b;
    }

    /* Firefox */
    .volume-calculator__items-list {
        scrollbar-width: thin;
        scrollbar-color: #94a3b8 #e2e8f0;
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
        flex: 1;
        min-width: 0;
        padding-right: var(--space-2);
    }

    .volume-calculator__item-counter {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-shrink: 0;
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
        width: 32px;
        text-align: center;
        font-weight: var(--font-semibold);
        color: var(--color-info-bar);
        font-size: inherit;
        font-family: inherit;
        border: none;
        background: transparent;
        outline: none;
        padding: 0;
        cursor: text;
        border-radius: var(--radius-sm);
        -moz-appearance: textfield;
    }

    .volume-calculator__counter-value::-webkit-inner-spin-button,
    .volume-calculator__counter-value::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .volume-calculator__counter-value:focus {
        background-color: rgba(30, 58, 95, 0.1);
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
        min-width: 0; /* Override browser's default input min-width */
        width: 0; /* Force flex to calculate width from flex-grow, not content */
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
