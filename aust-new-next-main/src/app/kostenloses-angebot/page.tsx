'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './kostenloses-angebot.module.css';

interface Item {
  name: string;
  quantity: number;
  volumePerUnit: number;
}

interface Category {
  name: string;
  items: Item[];
}

const initialCategories: Category[] = [
  {
    name: "Wohnzimmer",
    items: [
      { name: "Anbauwand bis 38cm Tiefe (pro Meter)", quantity: 0, volumePerUnit: 0.38 },
      { name: "Anbauwand über 38cm Tiefe (pro Meter)", quantity: 0, volumePerUnit: 0.38 },
      { name: "Bilder bis 0,8 m", quantity: 0, volumePerUnit: 0.1 },
      { name: "Bilder über 0,8 m", quantity: 0, volumePerUnit: 0.1 },
      { name: "Brücke", quantity: 0, volumePerUnit: 0.2 },
      { name: "Bücherregal, zerlegbar (pro Meter)", quantity: 0, volumePerUnit: 0.5 },
      { name: "Buffet mit Aufsatz", quantity: 0, volumePerUnit: 0.8 },
      { name: "Buffet ohne Aufsatz", quantity: 0, volumePerUnit: 0.7 },
      { name: "Deckenlampe", quantity: 0, volumePerUnit: 0.05 },
      { name: "Fernseher", quantity: 0, volumePerUnit: 0.3 },
      { name: "Flügel", quantity: 0, volumePerUnit: 1.0 },
      { name: "Heimorgel", quantity: 0, volumePerUnit: 0.8 },
      { name: "Klavier", quantity: 0, volumePerUnit: 1.2 },
      { name: "Lüster", quantity: 0, volumePerUnit: 0.15 },
      { name: "Musikschrank / Turm", quantity: 0, volumePerUnit: 0.9 },
      { name: "Nähmaschine (Schrank)", quantity: 0, volumePerUnit: 0.2 },
      { name: "Schreibtisch bis 1,6 m", quantity: 0, volumePerUnit: 0.6 },
      { name: "Schreibtisch über 1,6 m", quantity: 0, volumePerUnit: 0.8 },
      { name: "Sessel mit Armlehnen", quantity: 0, volumePerUnit: 0.5 },
      { name: "Sessel ohne Armlehnen", quantity: 0, volumePerUnit: 0.4 },
      { name: "Sideboard groß", quantity: 0, volumePerUnit: 0.9 },
      { name: "Sideboard klein", quantity: 0, volumePerUnit: 0.7 },
      { name: "Sitzlandschaft (Element), je Sitz", quantity: 0, volumePerUnit: 0.6 },
      { name: "Sofa, Couch, Liege, je Sitz", quantity: 0, volumePerUnit: 0.8 },
      { name: "Standuhr", quantity: 0, volumePerUnit: 0.4 },
      { name: "Stehlampe", quantity: 0, volumePerUnit: 0.3 },
      { name: "Stereoanlage", quantity: 0, volumePerUnit: 0.2 },
      { name: "Stuhl", quantity: 0, volumePerUnit: 0.2 },
      { name: "Stuhl mit Armlehnen", quantity: 0, volumePerUnit: 0.3 },
      { name: "Teppich", quantity: 0, volumePerUnit: 0.5 },
      { name: "Tisch bis 0,6 m", quantity: 0, volumePerUnit: 0.4 },
      { name: "Tisch bis 1,0 m", quantity: 0, volumePerUnit: 0.6 },
      { name: "Tisch bis 1,2 m", quantity: 0, volumePerUnit: 0.7 },
      { name: "Tisch über 1,2 m", quantity: 0, volumePerUnit: 0.9 },
      { name: "TV-Schrank", quantity: 0, volumePerUnit: 0.5 },
      { name: "Video / DVD-Player", quantity: 0, volumePerUnit: 0.1 },
      { name: "Wohnzimmerschrank, zerlegbar (pro Meter)", quantity: 0, volumePerUnit: 0.4 },
      { name: "Umzugskarton bis 80 l (gepackt)", quantity: 0, volumePerUnit: 0.1 },
      { name: "Umzugskarton über 80 l (gepackt)", quantity: 0, volumePerUnit: 0.2 }
    ],
  },
  {
    name: "Küche",
    items: [
      { name: "Arbeitsplatte, durchgehend (pro Meter)", quantity: 0, volumePerUnit: 0.5 },
      { name: "Besenschrank", quantity: 0, volumePerUnit: 0.8 },
      { name: "Buffet mit Aufsätzen", quantity: 0, volumePerUnit: 0.8 },
      { name: "Deckenlampe", quantity: 0, volumePerUnit: 0.05 },
      { name: "Eckbank je Sitz", quantity: 0, volumePerUnit: 0.3 },
      { name: "Geschirrspülmaschine", quantity: 0, volumePerUnit: 0.7 },
      { name: "Herd", quantity: 0, volumePerUnit: 0.6 },
      { name: "Kühlschrank / Truhe bis 120 l", quantity: 0, volumePerUnit: 0.7 },
      { name: "Kühlschrank / Truhe über 120 l", quantity: 0, volumePerUnit: 0.9 },
      { name: "Mikrowelle", quantity: 0, volumePerUnit: 0.2 },
      { name: "Oberteil je Tür", quantity: 0, volumePerUnit: 0.15 },
      { name: "Stuhl", quantity: 0, volumePerUnit: 0.2 },
      { name: "Teppich", quantity: 0, volumePerUnit: 0.5 },
      { name: "Tisch bis 0,6 m", quantity: 0, volumePerUnit: 0.4 },
      { name: "Tisch bis 1,0 m", quantity: 0, volumePerUnit: 0.6 },
      { name: "Tisch bis 1,2 m", quantity: 0, volumePerUnit: 0.7 },
      { name: "Tisch über 1,2 m", quantity: 0, volumePerUnit: 0.9 },
      { name: "Küchenoberschrank (pro Tür)", quantity: 0, volumePerUnit: 0.15 },
      { name: "Küchenunterschrank (pro Tür)", quantity: 0, volumePerUnit: 0.15 },
      { name: "Waschmaschine / Trockner", quantity: 0, volumePerUnit: 0.8 },
      { name: "Umzugskarton bis 80 l (gepackt)", quantity: 0, volumePerUnit: 0.1 },
      { name: "Umzugskarton über 80 l (gepackt)", quantity: 0, volumePerUnit: 0.2 }
    ],
  },
  {
    name: "Esszimmer",
    items: [
      { name: "Bilder bis 0,8 m", quantity: 0, volumePerUnit: 0.1 },
      { name: "Bilder über 0,8 m", quantity: 0, volumePerUnit: 0.1 },
      { name: "Brücke", quantity: 0, volumePerUnit: 0.2 },
      { name: "Deckenlampe", quantity: 0, volumePerUnit: 0.05 },
      { name: "Eckbank je Sitz", quantity: 0, volumePerUnit: 0.3 },
      { name: "Hausbar", quantity: 0, volumePerUnit: 0.4 },
      { name: "Sekretär", quantity: 0, volumePerUnit: 0.5 },
      { name: "Sideboard groß", quantity: 0, volumePerUnit: 0.9 },
      { name: "Sideboard klein", quantity: 0, volumePerUnit: 0.7 },
      { name: "Stehlampe", quantity: 0, volumePerUnit: 0.3 },
      { name: "Stuhl", quantity: 0, volumePerUnit: 0.2 },
      { name: "Stuhl mit Armlehnen", quantity: 0, volumePerUnit: 0.3 },
      { name: "Teewagen (nicht zerlegbar)", quantity: 0, volumePerUnit: 0.5 },
      { name: "Teppich", quantity: 0, volumePerUnit: 0.5 },
      { name: "Tisch bis 0,6 m", quantity: 0, volumePerUnit: 0.4 },
      { name: "Tisch bis 1,0 m", quantity: 0, volumePerUnit: 0.6 },
      { name: "Tisch bis 1,2 m", quantity: 0, volumePerUnit: 0.7 },
      { name: "Tisch über 1,2 m", quantity: 0, volumePerUnit: 0.9 },
      { name: "Vitrine (Glasschrank)", quantity: 0, volumePerUnit: 0.8 },
      { name: "Umzugskarton bis 80 l (gepackt)", quantity: 0, volumePerUnit: 0.1 },
      { name: "Umzugskarton über 80 l (gepackt)", quantity: 0, volumePerUnit: 0.2 }
    ],
  },
  {
    name: "Badezimmer",
    items: [
      { name: "Deckenlampe", quantity: 0, volumePerUnit: 0.05 },
      { name: "Kleiderablage", quantity: 0, volumePerUnit: 0.2 },
      { name: "Stuhl, Hocker", quantity: 0, volumePerUnit: 0.2 },
      { name: "Toilettenschrank", quantity: 0, volumePerUnit: 0.3 },
      { name: "Truhe, Kommode", quantity: 0, volumePerUnit: 0.4 },
      { name: "Wäschekorb", quantity: 0, volumePerUnit: 0.2 }
    ],
  },
  {
    name: "Sonstiges",
    items: [
      { name: "Autoreifen", quantity: 0, volumePerUnit: 0.5 },
      { name: "Blumenkübel / Kasten", quantity: 0, volumePerUnit: 0.4 },
      { name: "Bügelbrett", quantity: 0, volumePerUnit: 0.3 },
      { name: "Dreirad / Kinderrad", quantity: 0, volumePerUnit: 0.3 },
      { name: "Fahrrad / Moped", quantity: 0, volumePerUnit: 0.5 },
      { name: "Gartengeräte", quantity: 0, volumePerUnit: 0.6 },
      { name: "Gartengrill", quantity: 0, volumePerUnit: 0.7 },
      { name: "Kinderwagen", quantity: 0, volumePerUnit: 0.5 },
      { name: "Klapptisch / Klappstuhl", quantity: 0, volumePerUnit: 0.3 },
      { name: "Koffer", quantity: 0, volumePerUnit: 0.2 },
      { name: "Leiter je angefangener m", quantity: 0, volumePerUnit: 0.3 },
      { name: "Motorrad", quantity: 0, volumePerUnit: 1.0 },
      { name: "Mülltonne", quantity: 0, volumePerUnit: 0.8 },
      { name: "Rasenmäher Hand", quantity: 0, volumePerUnit: 0.4 },
      { name: "Rasenmäher Motor", quantity: 0, volumePerUnit: 0.6 },
      { name: "Regal zerlegbar je angefangender m", quantity: 0, volumePerUnit: 0.5 },
      { name: "Schlitten", quantity: 0, volumePerUnit: 0.7 },
      { name: "Schubkarre", quantity: 0, volumePerUnit: 0.8 },
      { name: "Ski", quantity: 0, volumePerUnit: 0.5 },
      { name: "Sonnenbank", quantity: 0, volumePerUnit: 1.0 },
      { name: "Sonnenschirm", quantity: 0, volumePerUnit: 0.3 },
      { name: "Staubsauger", quantity: 0, volumePerUnit: 0.5 },
      { name: "Tischtennisplatte", quantity: 0, volumePerUnit: 1.2 },
      { name: "Werkzeugkoffer", quantity: 0, volumePerUnit: 0.4 },
      { name: "Werkzeugschrank", quantity: 0, volumePerUnit: 0.7 },
      { name: "Umzugskarton bis 80 l (gepackt)", quantity: 0, volumePerUnit: 0.1 },
      { name: "Umzugskarton über 80 l (gepackt)", quantity: 0, volumePerUnit: 0.2 }
    ],
  },
  {
    name: "Weitere Zimmer",
    items: [
      { name: "Aktenschrank (pro Meter)", quantity: 0, volumePerUnit: 0.5 },
      { name: "Brücke", quantity: 0, volumePerUnit: 0.2 },
      { name: "Bücherregal, zerlegbar (pro Meter)", quantity: 0, volumePerUnit: 0.5 },
      { name: "Computer: PC / EDV - Anlage", quantity: 0, volumePerUnit: 0.8 },
      { name: "Deckenlampe", quantity: 0, volumePerUnit: 0.05 },
      { name: "Schreibtisch bis 1,6 m", quantity: 0, volumePerUnit: 0.6 },
      { name: "Schreibtisch über 1,6 m", quantity: 0, volumePerUnit: 0.8 },
      { name: "Schreibtischcontainer", quantity: 0, volumePerUnit: 0.5 },
      { name: "Schreibtischstuhl", quantity: 0, volumePerUnit: 0.4 },
      { name: "Sessel mit Armlehnen", quantity: 0, volumePerUnit: 0.5 },
      { name: "Sessel ohne Armlehnen", quantity: 0, volumePerUnit: 0.4 },
      { name: "Stehlampe", quantity: 0, volumePerUnit: 0.3 },
      { name: "Teppich", quantity: 0, volumePerUnit: 0.5 },
      { name: "Tisch bis 0,6 m", quantity: 0, volumePerUnit: 0.4 },
      { name: "Tisch bis 1,0 m", quantity: 0, volumePerUnit: 0.6 },
      { name: "Tisch bis 1,2 m", quantity: 0, volumePerUnit: 0.7 },
      { name: "Tisch über 1,2 m", quantity: 0, volumePerUnit: 0.9 },
      { name: "Tischkopierer", quantity: 0, volumePerUnit: 0.8 },
      { name: "Winkelkombination", quantity: 0, volumePerUnit: 0.7 },
      { name: "Umzugskarton bis 80 l (gepackt)", quantity: 0, volumePerUnit: 0.1 },
      { name: "Umzugskarton über 80 l (gepackt)", quantity: 0, volumePerUnit: 0.2 }
    ],
  },
  {
    name: "Schlafzimmer",
    items: [
      { name: "Bettgestell (De- & Montage)", quantity: 0, volumePerUnit: 0.8 },
      { name: "Bettzeug je Betteinheit", quantity: 0, volumePerUnit: 0.3 },
      { name: "Bilder bis 0,8 m", quantity: 0, volumePerUnit: 0.1 },
      { name: "Bilder über 0,8 m", quantity: 0, volumePerUnit: 0.1 },
      { name: "Deckenlampe", quantity: 0, volumePerUnit: 0.05 },
      { name: "Doppelbett komplett", quantity: 0, volumePerUnit: 1.2 },
      { name: "Einzelbett komplett", quantity: 0, volumePerUnit: 0.9 },
      { name: "Fernseher", quantity: 0, volumePerUnit: 0.3 },
      { name: "französisches Bett komplett", quantity: 0, volumePerUnit: 1.0 },
      { name: "Frisierkommode (mit Spiegel)", quantity: 0, volumePerUnit: 0.7 },
      { name: "Kleiderbehältnis", quantity: 0, volumePerUnit: 0.4 },
      { name: "Kommode", quantity: 0, volumePerUnit: 0.5 },
      { name: "Nachttisch", quantity: 0, volumePerUnit: 0.3 },
      { name: "Schrank bis 2 Türen, nicht zerlegbar", quantity: 0, volumePerUnit: 0.9 },
      { name: "Kleiderschrank, zerlegbar (pro Meter)", quantity: 0, volumePerUnit: 0.4 },
      { name: "Spiegel über 0,8 m", quantity: 0, volumePerUnit: 0.2 },
      { name: "Stuhl, Hocker", quantity: 0, volumePerUnit: 0.2 },
      { name: "Teppich", quantity: 0, volumePerUnit: 0.5 },
      { name: "TV-Schrank", quantity: 0, volumePerUnit: 0.5 },
      { name: "Wäschetruhe", quantity: 0, volumePerUnit: 0.6 },
      { name: "Umzugskarton bis 80 l (gepackt)", quantity: 0, volumePerUnit: 0.1 },
      { name: "Umzugskarton über 80 l (gepackt)", quantity: 0, volumePerUnit: 0.2 }
    ],
  },
  {
    name: "Kinderzimmer",
    items: [
      { name: "Kinderzimmer Anbauwand bis 38cm Tiefe (pro Meter)", quantity: 0, volumePerUnit: 0.38 },
      { name: "Anbauwand über 38cm Tiefe je ang. m", quantity: 0, volumePerUnit: 0.38 },
      { name: "Bett komplett", quantity: 0, volumePerUnit: 1.0 },
      { name: "Bettzeug je Betteinheit", quantity: 0, volumePerUnit: 0.3 },
      { name: "Brücke", quantity: 0, volumePerUnit: 0.2 },
      { name: "Deckenlampe", quantity: 0, volumePerUnit: 0.05 },
      { name: "Etagenbett komplett", quantity: 0, volumePerUnit: 1.2 },
      { name: "Kinderbett komplett", quantity: 0, volumePerUnit: 0.9 },
      { name: "Kleiderbehältnis", quantity: 0, volumePerUnit: 0.4 },
      { name: "Kommode", quantity: 0, volumePerUnit: 0.5 },
      { name: "Laufgitter", quantity: 0, volumePerUnit: 0.3 },
      { name: "Nachttisch", quantity: 0, volumePerUnit: 0.3 },
      { name: "Schrank bis 2 Türen nicht zerlegbar", quantity: 0, volumePerUnit: 0.9 },
      { name: "Schrank zerlegbar je angef. m", quantity: 0, volumePerUnit: 0.4 },
      { name: "Schreibpult", quantity: 0, volumePerUnit: 0.5 },
      { name: "Spielzeugkiste", quantity: 0, volumePerUnit: 0.4 },
      { name: "Stuhl, Hocker", quantity: 0, volumePerUnit: 0.2 },
      { name: "Teppich", quantity: 0, volumePerUnit: 0.5 },
      { name: "Tisch bis 0,6 m", quantity: 0, volumePerUnit: 0.4 },
      { name: "Tisch bis 1,0 m", quantity: 0, volumePerUnit: 0.6 },
      { name: "Tisch bis 1,2 m", quantity: 0, volumePerUnit: 0.7 },
      { name: "Tisch über 1,2 m", quantity: 0, volumePerUnit: 0.9 }
    ],
  },
  {
    name: "Search",
    items: [
      { name: "Anbauwand b. 38cm Tiefe je ang. m", quantity: 0, volumePerUnit: 0.38 },
      { name: "Anbauwand ü. 38cm Tiefe je angef. m", quantity: 0, volumePerUnit: 0.38 },
      { name: "Bilder bis 0,8 m", quantity: 0, volumePerUnit: 0.1 },
      { name: "Bilder über 0,8 m", quantity: 0, volumePerUnit: 0.1 },
      { name: "Brücke", quantity: 0, volumePerUnit: 0.2 },
      { name: "Bücherregal zerlegbar je angef. m", quantity: 0, volumePerUnit: 0.5 },
      { name: "Buffet mit Aufsatz", quantity: 0, volumePerUnit: 0.8 },
      { name: "Buffet ohne Aufsatz", quantity: 0, volumePerUnit: 0.7 },
      { name: "Deckenlampe", quantity: 0, volumePerUnit: 0.05 },
      { name: "Fernseher", quantity: 0, volumePerUnit: 0.3 },
      { name: "Flügel", quantity: 0, volumePerUnit: 1.0 },
      { name: "Heimorgel", quantity: 0, volumePerUnit: 0.8 },
      { name: "Klavier", quantity: 0, volumePerUnit: 1.2 },
      { name: "Lüster", quantity: 0, volumePerUnit: 0.15 },
      { name: "Musikschrank / Turm", quantity: 0, volumePerUnit: 0.9 },
      { name: "Nähmaschine (Schrank)", quantity: 0, volumePerUnit: 0.2 },
      { name: "Schreibtisch bis 1,6 m", quantity: 0, volumePerUnit: 0.6 },
      { name: "Schreibtisch über 1,6 m", quantity: 0, volumePerUnit: 0.8 },
      { name: "Sessel mit Armlehnen", quantity: 0, volumePerUnit: 0.5 },
      { name: "Sessel ohne Armlehnen", quantity: 0, volumePerUnit: 0.4 },
      { name: "Sideboard groß", quantity: 0, volumePerUnit: 0.9 },
      { name: "Sideboard klein", quantity: 0, volumePerUnit: 0.7 },
      { name: "Sitzlandschaft (Element), je Sitz", quantity: 0, volumePerUnit: 0.6 },
      { name: "Sofa, Couch, Liege, je Sitz", quantity: 0, volumePerUnit: 0.8 },
      { name: "Standuhr", quantity: 0, volumePerUnit: 0.4 },
      { name: "Stehlampe", quantity: 0, volumePerUnit: 0.3 },
      { name: "Stereoanlage", quantity: 0, volumePerUnit: 0.2 },
      { name: "Stuhl", quantity: 0, volumePerUnit: 0.2 },
      { name: "Stuhl mit Armlehnen", quantity: 0, volumePerUnit: 0.3 },
      { name: "Teppich", quantity: 0, volumePerUnit: 0.5 },
      { name: "Tisch bis 0,6 m", quantity: 0, volumePerUnit: 0.4 },
      { name: "Tisch bis 1,0 m", quantity: 0, volumePerUnit: 0.6 },
      { name: "Tisch bis 1,2 m", quantity: 0, volumePerUnit: 0.7 },
      { name: "Tisch über 1,2 m", quantity: 0, volumePerUnit: 0.9 },
      { name: "TV-Schrank", quantity: 0, volumePerUnit: 0.5 },
      { name: "Video / DVD-Player", quantity: 0, volumePerUnit: 0.1 },
      { name: "Wohnz.-Schrank zerlegb. je angef. m", quantity: 0, volumePerUnit: 0.4 },
      { name: "Umzugskarton bis 80 l (gepackt)", quantity: 0, volumePerUnit: 0.1 },
      { name: "Umzugskarton über 80 l (gepackt)", quantity: 0, volumePerUnit: 0.2 }
    ],
  },
];

const additionalServicesOptions: { id: string; label: string }[] = [
  { id: 'packing', label: 'Einpackservice' },
  { id: 'unpacking', label: 'Auspackservice' },
  { id: 'assembly', label: 'Möbelmontage' },
  { id: 'disassembly', label: 'Möbeldemontage' },
  { id: 'storage', label: 'Einlagerung' },
  { id: 'disposal', label: 'Entsorgung Sperrmüll' },
];

const KostenlosesAngebotPage = () => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [openRoomIndex, setOpenRoomIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<
    { categoryIndex: number; itemIndex: number; item: Item }[]
  >([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    startAddress: '',
    endAddress: '',
    date: '',
    message: '',
    volume: 0,
    selectedServices: [] as string[],
    privacyAccepted: false,
  });

  const toggleRoom = (index: number) => {
    setOpenRoomIndex(openRoomIndex === index ? null : index);
  };

  const increment = (catIndex: number, itemIndex: number) => {
    setCategories((prevCategories) => {
      const newCategories = [...prevCategories];
      newCategories[catIndex].items[itemIndex].quantity++;
      return newCategories;
    });
  };

  const decrement = (catIndex: number, itemIndex: number) => {
    setCategories((prevCategories) => {
      const newCategories = [...prevCategories];
      if (newCategories[catIndex].items[itemIndex].quantity > 0) {
        newCategories[catIndex].items[itemIndex].quantity--;
      }
      return newCategories;
    });
  };

  const totalVolume = useMemo(() => {
    return categories.reduce((totalCat, category) => {
      return (
        totalCat +
        category.items.reduce((totalItem, item) => {
          return totalItem + item.quantity * item.volumePerUnit;
        }, 0)
      );
    }, 0);
  }, [categories]);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const results: { categoryIndex: number; itemIndex: number; item: Item }[] = [];
    categories.forEach((category, categoryIndex) => {
      category.items.forEach((item, itemIndex) => {
        if (item.name.toLowerCase().includes(query)) {
          results.push({
            categoryIndex,
            itemIndex,
            item,
          });
        }
      });
    });
    setSearchResults(results);
  }, [searchQuery, categories]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'privacy') {
        setFormData((prev) => ({ ...prev, privacyAccepted: checked }));
      } else {
        setFormData((prev) => {
          const newSelectedServices = checked
            ? [...prev.selectedServices, value]
            : prev.selectedServices.filter((service) => service !== value);
          return { ...prev, selectedServices: newSelectedServices };
        });
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const isFormValid = useMemo(() => {
    return (
      formData.name !== '' &&
      formData.email !== '' &&
      formData.phone !== '' &&
      formData.startAddress !== '' &&
      formData.endAddress !== '' &&
      formData.date !== '' &&
      formData.privacyAccepted
    );
  }, [formData]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, volume: parseFloat(totalVolume.toFixed(2)) }));
  }, [totalVolume]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.append("form-name", "volume-calculation");
    data.append("bot-field", "");
    const formDataEncoded = new URLSearchParams(Array.from(data.entries()) as string[][]).toString();

    try {
      await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formDataEncoded,
      });
      alert("Formular erfolgreich gesendet!");
      // Optionally redirect to a success page
      window.location.href = "/success";
    } catch (error) {
      alert("Fehler beim Senden des Formulars: " + (error as Error).message);
    }
  };

  return (
    <>
      <div className={styles['page-intro-container']}>
        <h1>Ihr Umzugsvolumen einfach berechnen & individuelles Angebot erhalten</h1>
        <p>Nutzen Sie unseren detaillierten Umzugsrechner, um das Volumen Ihres Hausrats schnell und einfach zu ermitteln. Füllen Sie anschließend das Formular aus, um ein unverbindliches Angebot von Ihrer Umzugsfirma für Hildesheim, Hannover und darüber hinaus zu erhalten.</p>
      </div>

      <form method="POST" className={styles.formContainer} onSubmit={handleSubmit}>

        <section className={styles['volume-calculator']}>
          <h2 className={styles.heading2}>Schritt 1. Volumenberechnung für Ihren Umzug</h2>

          <div className={styles['search-container']}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Möbelstück suchen..."
              className={styles['search-input']}
              aria-label="Möbelstück suchen"
              role="searchbox"
            />
          </div>

          {searchQuery.trim() && searchResults.length > 0 ? (
            <div className={styles['search-results']} aria-live="polite">
              <h3 className={styles.heading3}>Suchergebnisse</h3>
              {searchResults.map((result) => (
                <div className={styles.item} key={`${result.categoryIndex}-${result.itemIndex}`}>
                  <label>{result.item.name}</label>
                  <div className={styles.counter}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); decrement(result.categoryIndex, result.itemIndex); }}
                      aria-label={`${result.item.name} entfernen`}
                    >
                      -
                    </button>
                    <span aria-live="polite">{categories[result.categoryIndex].items[result.itemIndex].quantity}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); increment(result.categoryIndex, result.itemIndex); }}
                      aria-label={`${result.item.name} hinzufügen`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className={styles['no-results']} aria-live="polite">
              <p>Keine Ergebnisse für &quot;{searchQuery}&quot; gefunden.</p>
            </div>
          ) : null}

          {categories.map((category, catIndex) => (
            category.name !== "Search" && (
              <div className={styles.room} key={catIndex}>
                <div
                  className={styles['room-header']}
                  onClick={() => toggleRoom(catIndex)}
                  role="button"
                  aria-expanded={openRoomIndex === catIndex}
                  tabIndex={0}
                >
                  <h3>{category.name}</h3>
                </div>
                {openRoomIndex === catIndex && (
                  <div className={styles['room-content']}>
                    {category.items.map((item, itemIndex) => (
                      <div className={styles.item} key={itemIndex}>
                        <label>{item.name}</label>
                        <div className={styles.counter}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); decrement(catIndex, itemIndex); }}
                            aria-label={`${item.name} entfernen`}
                          >
                            -
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); increment(catIndex, itemIndex); }}
                            aria-label={`${item.name} hinzufügen`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ))}

          <div className={styles['total-volume']}>
            <p><strong>Ihr geschätztes Umzugsvolumen:</strong> {totalVolume.toFixed(2)} m³</p>
            <p className={styles['volume-note']}>Bitte überprüfen Sie Ihre Eingaben. Dieses Volumen dient als Grundlage für Ihr individuelles Angebot.</p>
          </div>
          <input type="hidden" name="calculated-volume" value={totalVolume.toFixed(2)} />
        </section>

        <section className={styles['contact-form']}>
          <h2 className={styles.heading2}>Fordern Sie jetzt Ihr persönliches Angebot an</h2>
          <div className={styles['form-group']}>
            <label htmlFor="name">Ihr Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Ihr Name"
              required
            />
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="email">Ihre E-Mail-Adresse *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="Ihre E-Mail-Adresse"
              required
            />
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="phone">Ihre Telefonnummer *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="Ihre Telefonnummer"
              required
            />
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="startAddress">Auszugsadresse (Straße, Nr., PLZ, Ort) *</label>
            <input
              type="text"
              id="startAddress"
              name="startAddress"
              value={formData.startAddress}
              onChange={handleFormChange}
              placeholder="Straße, Hausnummer, PLZ, Ort"
              required
            />
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="endAddress">Einzugsadresse (Straße, Nr., PLZ, Ort) *</label>
            <input
              type="text"
              id="endAddress"
              name="endAddress"
              value={formData.endAddress}
              onChange={handleFormChange}
              placeholder="Straße, Hausnummer, PLZ, Ort"
              required
            />
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="date">Ihr Wunschtermin für den Umzug *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className={styles['form-group']}>
            <label>Gewünschte Zusatzleistungen (optional auswählen):</label>
            <div className={styles['checkbox-group']}>
              {additionalServicesOptions.map((serviceOption) => (
                <label className={styles['checkbox-label']} key={serviceOption.id}>
                  <input
                    type="checkbox"
                    name="selectedServices"
                    value={serviceOption.id}
                    checked={formData.selectedServices.includes(serviceOption.id)}
                    onChange={handleFormChange}
                  />
                  {serviceOption.label}
                </label>
              ))}
            </div>
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="message">Ihre Nachricht an uns (optional)</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleFormChange}
              placeholder="Platz für weitere Details oder Fragen"
            ></textarea>
          </div>
          <div className={`${styles['form-group']} ${styles['privacy-checkbox']}`}>
            <label className={styles['checkbox-label']}>
              <input
                type="checkbox"
                name="privacy"
                checked={formData.privacyAccepted}
                onChange={handleFormChange}
                required
              />
              Ich stimme zu, dass meine Angaben aus dem Formular zur Bearbeitung meiner Anfrage erhoben und verarbeitet werden. Die 
              <Link href="/datenschutz" target="_blank">
                Datenschutzerklärung
              </Link>
              habe ich zur Kenntnis genommen.
            </label>
          </div>
        </section>

        <button type="submit" className={`${styles['submit-button']} button`} disabled={!isFormValid}>
          Kostenloses Angebot anfordern
        </button>
      </form>
    </>
  );
};

export default KostenlosesAngebotPage;
