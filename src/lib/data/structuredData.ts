// Centralized Structured Data for SEO
// Edit this file to update structured data across the entire site

export const businessInfo = {
	"@type": "MovingCompany",
	"@id": "https://www.aust-umzuege.de/#organization",
	name: "Aust Umzüge und Haushaltsauflösungen",
	alternateName: "Aust Umzüge",
	legalName: "Aust Umzüge und Haushaltsauflösungen",
	url: "https://www.aust-umzuege.de",
	logo: "https://www.aust-umzuege.de/LogoName_transparent.webp",
	image: "https://www.aust-umzuege.de/LogoName_transparent.webp",
	description:
		"Professionelle Umzüge, Haushaltsauflösungen und Montagen in Hildesheim und Umgebung",
	telephone: "+4951217558379",
	email: "info@aust-umzuege.de",
	address: {
		"@type": "PostalAddress",
		streetAddress: "Kaiserstr. 32",
		addressLocality: "Hildesheim",
		postalCode: "31134",
		addressRegion: "Niedersachsen",
		addressCountry: "DE"
	},
	vatID: "DE330779170",
	geo: {
		"@type": "GeoCoordinates",
		latitude: "52.150002",
		longitude: "9.951667"
	},
	areaServed: [
		{
			"@type": "City",
			name: "Hildesheim"
		},
		{
			"@type": "State",
			name: "Niedersachsen"
		}
	],
	priceRange: "€€",
	openingHoursSpecification: [
		{
			"@type": "OpeningHoursSpecification",
			dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
			opens: "08:00",
			closes: "18:00"
		}
	],
	sameAs: [
		"https://facebook.com/austumzuege",
		"https://instagram.com/austumzuege",
		"https://tiktok.com/@austumzuege"
	],
	founder: {
		"@type": "Person",
		name: "Alex Aust"
	}
};

export const services = {
	privatumzug: {
		"@type": "Service",
		serviceType: "Privatumzug",
		name: "Privatumzug in Hildesheim",
		description:
			"Stressfreier Privatumzug in Hildesheim und Umgebung. Wir bieten Full-Service, Montage und faire Preise für Ihren Wohnungswechsel.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Hildesheim", "Niedersachsen"],
		url: "https://www.aust-umzuege.de/leistungen/privatumzug",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR"
		}
	},
	firmenumzug: {
		"@type": "Service",
		serviceType: "Firmenumzug",
		name: "Firmenumzug in Hildesheim",
		description:
			"Professionelle Firmen- und Büroumzüge. Minimale Ausfallzeiten, IT-Transport und Wochenendservice für Ihr Unternehmen.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Hildesheim", "Niedersachsen"],
		url: "https://www.aust-umzuege.de/leistungen/firmenumzug",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR"
		}
	},
	seniorenumzug: {
		"@type": "Service",
		serviceType: "Seniorenumzug",
		name: "Seniorenumzug in Hildesheim",
		description:
			"Einfühlsame Begleitung beim Umzug für Senioren. Full-Service, Montage und Entsorgung für einen sorgenfreien Wohnungswechsel.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Hildesheim", "Niedersachsen"],
		url: "https://www.aust-umzuege.de/leistungen/seniorenumzug",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR"
		}
	},
	fernUebersee: {
		"@type": "Service",
		serviceType: "Fern- und Überseeumzug",
		name: "Fern- und Überseeumzug",
		description:
			"Sicherer Umzug ins Ausland oder Übersee. Wir kümmern uns um Zollformalitäten, Verpackung und Logistik weltweit.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Worldwide"],
		url: "https://www.aust-umzuege.de/leistungen/fern-ueberseeumzug",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR"
		}
	},
	umzugshelfer: {
		"@type": "Service",
		serviceType: "Umzugshelfer",
		name: "Umzugshelfer mieten in Hildesheim",
		description:
			"Kräftige Umzugshelfer mieten. Unterstützung beim Tragen, Beladen und Entladen – stundenweise buchbar.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Hildesheim", "Niedersachsen"],
		url: "https://www.aust-umzuege.de/leistungen/umzugshelfer",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR"
		}
	},
	montage: {
		"@type": "Service",
		serviceType: "Möbelmontage",
		name: "Möbelmontage und Küchenmontage",
		description:
			"Fachgerechter Möbelaufbau und Küchenmontage. Unsere Schreiner sorgen für den perfekten Sitz Ihrer Einrichtung.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Hildesheim", "Niedersachsen"],
		url: "https://www.aust-umzuege.de/leistungen/montage",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR"
		}
	},
	lagerung: {
		"@type": "Service",
		serviceType: "Lagerung und Einlagerung",
		name: "Möbellagerung in Hildesheim",
		description:
			"Sichere Möbellagerung. Zwischenlagerung beim Umzug, Langzeitlagerung, flexible Laufzeiten.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Hildesheim", "Niedersachsen"],
		url: "https://www.aust-umzuege.de/leistungen/lagerung",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR"
		}
	},
	halteverbot: {
		"@type": "Service",
		serviceType: "Halteverbot einrichten",
		name: "Halteverbotszone für Umzug",
		description:
			"Offizielle Halteverbotszonen für Ihren Umzug. Wir kümmern uns um Antrag, Aufstellung und Abbau der Schilder.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Hildesheim", "Niedersachsen"],
		url: "https://www.aust-umzuege.de/leistungen/halteverbot",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR"
		}
	},
	umzugsberatung: {
		"@type": "Service",
		serviceType: "Umzugsberatung",
		name: "Kostenlose Umzugsberatung",
		description:
			"Kostenlose und unverbindliche Umzugsberatung vor Ort. Wir planen Ihren Umzug individuell und erstellen ein Festpreisangebot.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Hildesheim", "Niedersachsen"],
		url: "https://www.aust-umzuege.de/leistungen/umzugsberatung",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR",
			price: "0"
		}
	},
	haushaltsaufloesung: {
		"@type": "Service",
		serviceType: "Haushaltsauflösung",
		name: "Haushaltsauflösung und Entrümpelung",
		description:
			"Diskrete Haushaltsauflösungen und Entrümpelungen in Hildesheim. Besenreine Räumung und fachgerechte Entsorgung.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: ["Hildesheim", "Niedersachsen"],
		url: "https://www.aust-umzuege.de/leistungen/haushaltsaufloesung",
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceCurrency: "EUR"
		}
	}
};

export const articles = {
	umzugsCheckliste: {
		"@type": "Article",
		headline: "Die ultimative Umzugs-Checkliste",
		description:
			"Kostenlose Umzugs-Checkliste: Was Sie 4 Wochen, 1 Woche und am Umzugstag beachten müssen. Strukturierter Plan für stressfreien Wohnungswechsel.",
		author: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		publisher: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		datePublished: "2024-01-15",
		dateModified: "2024-01-15",
		image: "https://www.aust-umzuege.de/LogoName_transparent.webp",
		url: "https://www.aust-umzuege.de/ratgeber/umzugs-checkliste",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.aust-umzuege.de/ratgeber/umzugs-checkliste"
		},
		articleSection: "Ratgeber"
	},
	verpackungstipps: {
		"@type": "Article",
		headline: "Verpackungstipps vom Profi",
		description:
			"Professionelle Verpackungstipps für Ihren Umzug: Geschirr, Elektronik, Möbel und empfindliche Gegenstände sicher verpacken.",
		author: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		publisher: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		datePublished: "2024-01-15",
		dateModified: "2024-01-15",
		image: "https://www.aust-umzuege.de/LogoName_transparent.webp",
		url: "https://www.aust-umzuege.de/ratgeber/verpackungstipps",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.aust-umzuege.de/ratgeber/verpackungstipps"
		},
		articleSection: "Ratgeber"
	},
	haushaltsaufloesungen: {
		"@type": "Article",
		headline: "Haushaltsauflösungen und Entrümpelungen - Praktischer Ratgeber",
		description:
			"Praktischer Ratgeber für Haushaltsauflösungen: Tipps zu Herausforderungen, Transport, Entsorgungsmöglichkeiten und realistischer Zeitplanung.",
		author: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		publisher: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		datePublished: "2024-01-15",
		dateModified: "2024-01-15",
		image: "https://www.aust-umzuege.de/LogoName_transparent.webp",
		url: "https://www.aust-umzuege.de/ratgeber/haushaltsaufloesungen-entruempelungen",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.aust-umzuege.de/ratgeber/haushaltsaufloesungen-entruempelungen"
		},
		articleSection: "Ratgeber"
	},
	serioseUmzugsfirma: {
		"@type": "Article",
		headline: "Wie erkenne ich eine seriöse Umzugsfirma?",
		description:
			"Seriöse Umzugsfirma finden: Erkennen Sie Red Flags, stellen Sie die richtigen Fragen und vermeiden Sie schwarze Schafe.",
		author: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		publisher: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		datePublished: "2024-01-15",
		dateModified: "2024-01-15",
		image: "https://www.aust-umzuege.de/LogoName_transparent.webp",
		url: "https://www.aust-umzuege.de/ratgeber/seriose-umzugsfirma",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.aust-umzuege.de/ratgeber/seriose-umzugsfirma"
		},
		articleSection: "Ratgeber"
	}
};

// Overview pages - ItemList schemas
export const leistungenOverview = {
	"@type": "ItemList",
	name: "Umzugsleistungen",
	description: "Alle Leistungen von Aust Umzüge auf einen Blick",
	url: "https://www.aust-umzuege.de/leistungen",
	numberOfItems: 10,
	itemListElement: [
		{
			"@type": "ListItem",
			position: 1,
			item: {
				"@type": "Service",
				name: "Privatumzug",
				url: "https://www.aust-umzuege.de/leistungen/privatumzug"
			}
		},
		{
			"@type": "ListItem",
			position: 2,
			item: {
				"@type": "Service",
				name: "Firmenumzug",
				url: "https://www.aust-umzuege.de/leistungen/firmenumzug"
			}
		},
		{
			"@type": "ListItem",
			position: 3,
			item: {
				"@type": "Service",
				name: "Seniorenumzug",
				url: "https://www.aust-umzuege.de/leistungen/seniorenumzug"
			}
		},
		{
			"@type": "ListItem",
			position: 4,
			item: {
				"@type": "Service",
				name: "Fern- & Überseeumzug",
				url: "https://www.aust-umzuege.de/leistungen/fern-ueberseeumzug"
			}
		},
		{
			"@type": "ListItem",
			position: 5,
			item: {
				"@type": "Service",
				name: "Umzugshelfer",
				url: "https://www.aust-umzuege.de/leistungen/umzugshelfer"
			}
		},
		{
			"@type": "ListItem",
			position: 6,
			item: {
				"@type": "Service",
				name: "Haushaltsauflösung",
				url: "https://www.aust-umzuege.de/leistungen/haushaltsaufloesung"
			}
		},
		{
			"@type": "ListItem",
			position: 7,
			item: {
				"@type": "Service",
				name: "Montage & Demontage",
				url: "https://www.aust-umzuege.de/leistungen/montage"
			}
		},
		{
			"@type": "ListItem",
			position: 8,
			item: {
				"@type": "Service",
				name: "Umzugsberatung",
				url: "https://www.aust-umzuege.de/leistungen/umzugsberatung"
			}
		},
		{
			"@type": "ListItem",
			position: 9,
			item: {
				"@type": "Service",
				name: "Lagerung & Einlagerung",
				url: "https://www.aust-umzuege.de/leistungen/lagerung"
			}
		},
		{
			"@type": "ListItem",
			position: 10,
			item: {
				"@type": "Service",
				name: "Halteverbot",
				url: "https://www.aust-umzuege.de/leistungen/halteverbot"
			}
		}
	]
};

export const ratgeberOverview = {
	"@type": "ItemList",
	name: "Umzugsratgeber",
	description: "Nützliche Tipps und Checklisten rund um den Umzug",
	url: "https://www.aust-umzuege.de/ratgeber",
	numberOfItems: 4,
	itemListElement: [
		{
			"@type": "ListItem",
			position: 1,
			item: {
				"@type": "Article",
				name: "Die ultimative Umzugs-Checkliste",
				url: "https://www.aust-umzuege.de/ratgeber/umzugs-checkliste"
			}
		},
		{
			"@type": "ListItem",
			position: 2,
			item: {
				"@type": "Article",
				name: "Verpackungstipps vom Profi",
				url: "https://www.aust-umzuege.de/ratgeber/verpackungstipps"
			}
		},
		{
			"@type": "ListItem",
			position: 3,
			item: {
				"@type": "Article",
				name: "Haushaltsauflösungen und Entrümpelungen",
				url: "https://www.aust-umzuege.de/ratgeber/haushaltsaufloesungen-entruempelungen"
			}
		},
		{
			"@type": "ListItem",
			position: 4,
			item: {
				"@type": "Article",
				name: "Wie erkenne ich eine seriöse Umzugsfirma?",
				url: "https://www.aust-umzuege.de/ratgeber/seriose-umzugsfirma"
			}
		}
	]
};

// Contact page schema
export const contactPage = {
	"@type": "ContactPage",
	name: "Kontakt",
	description: "Kontaktieren Sie Aust Umzüge in Hildesheim",
	url: "https://www.aust-umzuege.de/kontakt",
	mainEntity: {
		"@id": "https://www.aust-umzuege.de/#organization"
	}
};

// Breadcrumb helper function
export function createBreadcrumbs(items: Array<{ name: string; url?: string }>) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			...(item.url && { item: item.url })
		}))
	};
}
