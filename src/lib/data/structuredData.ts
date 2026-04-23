// Centralized Structured Data for SEO
// Edit this file to update structured data across the entire site

export interface Review {
	author: string;
	rating: number;
	date: string;
	text: string;
	url: string;
	badge?: string;
	reviewCount?: number;
	photoCount?: number;
}

export const reviews: Review[] = [
	{
		author: 'Quadrilla Murmelbahn',
		rating: 5,
		date: '2023-02-08',
		text: 'Wir haben mit der Firma Aust einen weiten Umzug gemacht. Dank guter Abschätzung des Volumens hat er uns das günstigste Angebot gemacht – wo andere Firmen mit einem 7,5 Tonner kommen wollten, sagte er ein 3,5 Tonner reicht. Alles hat rein gepasst und der Umzug reibungslos verlaufen. Die Sachen wurden professionell und gut geschützt geladen, die Mitarbeiter waren freundlich und umsichtig.',
		url: 'https://maps.app.goo.gl/mdsS98zcNBXUiqSPA',
		badge: 'Local Guide',
		reviewCount: 30,
	},
	{
		author: 'Luca Wulf',
		rating: 5,
		date: '2023-02-14',
		text: 'Meine Frau und ich haben unseren Umzug mit Aust Umzüge durchführen lassen. Der Umzug verlief reibungslos und außergewöhnlich zügig. Wir sind über 100km weit weg gezogen und es ist beim Transport kein Möbelstück zu schaden gekommen. Wir können Aust Umzüge bedenkenlos weiterempfehlen! Vielen Dank!',
		url: 'https://maps.app.goo.gl/qKpZhMhBTjvAdHLu9',
		badge: 'Local Guide',
		reviewCount: 8,
		photoCount: 8,
	},
	{
		author: 'Mathias M.',
		rating: 5,
		date: '2020-02-19',
		text: 'Junger Unternehmer, der seine Arbeit sehr gewissenhaft, schnell und zuverlässig erledigt. Fairer Preis, zeitnahe Absprache und schnelle Erledigung. Bei mir wurde eine Wohnung aufgelöst, was Herr Aust und sein Team sehr schnell erledigt haben. Danke dafür. Sehr zu empfehlen und weiterhin viel Erfolg.',
		url: 'https://maps.app.goo.gl/qNzfcMr4NYGdrMow5',
		badge: 'Local Guide',
		reviewCount: 128,
		photoCount: 11,
	},
	{
		author: 'Bea',
		rating: 5,
		date: '2025-11-12',
		text: 'Ich bin letzte Woche mit Aust Umzüge umgezogen und ich bin absolut begeistert! Das Team war pünktlich, super freundlich und extrem fleißig. Alles wurde sorgfältig und ordentlich eingepackt, abgebaut, transportiert und wieder aufgebaut. Die Jungs haben richtig tolle Arbeit geleistet – schnell, professionell und mit viel Engagement. Ich kann Aust Umzüge wirklich uneingeschränkt weiterempfehlen.',
		url: 'https://maps.app.goo.gl/KNcwFdaD9wWhzHZV9',
		reviewCount: 2,
		photoCount: 3,
	},
	{
		author: 'Nicole Stein',
		rating: 5,
		date: '2025-10-03',
		text: 'Klare Weiterempfehlung! Herr Aust und sein Team haben den Umzug meiner Mutter in eine betreute Wohnung wunderbar gemacht. Sehr hilfsbereit, zuverlässig und schnell. Die Kommunikation mit Herrn Aust war auch hervorragend. Kann ich uneingeschränkt weiterempfehlen!',
		url: 'https://maps.app.goo.gl/Dy1aFNHwmrhYvE4v7',
		reviewCount: 12,
	},
	{
		author: 'Hagen Dittmer',
		rating: 5,
		date: '2023-02-21',
		text: 'Ich habe sehr gute Erfahrungen mit der Firma Aust gemacht. Schnelles unkompliziertes Abchecken des Umzugsvolumens, sehr schnell lag der Kostenvoranschlag vor, Herr Aust war immer schnell zu erreichen, die Möbel wurden sorgfältig verpackt, das Team hat effizient gearbeitet und war sehr freundlich und zuvorkommend. Der Umzug begann pünktlich und blieb im Zeitrahmen.',
		url: 'https://maps.app.goo.gl/DtDtuZzKhnRgj8yg9',
		reviewCount: 11,
	},
];

export const aggregateRating = {
	ratingValue: 5.0,
	reviewCount: 71,
};

export const allReviewsUrl = "https://maps.app.goo.gl/z5e8m7QrGPa5Cssp6";

export const website = {
	"@type": "WebSite",
	"@id": "https://www.aust-umzuege.de/#website",
	url: "https://www.aust-umzuege.de",
	name: "Aust Umzüge",
	description: "Professionelle Umzüge, Haushaltsauflösungen und Montagen in Hildesheim und Umgebung",
	publisher: {
		"@id": "https://www.aust-umzuege.de/#organization"
	},
	inLanguage: "de-DE"
};

export const businessInfo = {
	"@type": "MovingCompany",
	"@id": "https://www.aust-umzuege.de/#organization",
	name: "Aust Umzüge & Haushaltsauflösungen",
	alternateName: "Aust Umzüge",
	legalName: "Aust Umzüge & Haushaltsauflösungen",
	url: "https://www.aust-umzuege.de",
	logo: {
		"@type": "ImageObject",
		url: "https://www.aust-umzuege.de/LogoName_transparent.webp",
		width: 150,
		height: 150
	},
	image: "https://www.aust-umzuege.de/seniorenumzuege-hildesheim-carousel-6.webp",
	description:
		"Professionelle Umzüge, Haushaltsauflösungen und Montagen in Hildesheim und Umgebung",
	telephone: "+4951217558379",
	email: "info@aust-umzuege.de",
	contactPoint: [
		{
			"@type": "ContactPoint",
			telephone: "+4951217558379",
			contactType: "customer service",
			availableLanguage: "German",
			areaServed: "DE"
		},
		{
			"@type": "ContactPoint",
			telephone: "+4917670745281",
			contactType: "customer service",
			contactOption: "https://api.whatsapp.com/send?phone=4917670745281",
			availableLanguage: "German",
			areaServed: "DE"
		}
	],
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
		latitude: 52.150002,
		longitude: 9.951667
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
			opens: "09:00",
			closes: "19:00"
		}
	],
	sameAs: [
		"https://www.facebook.com/profile.php?id=61576264141191",
		"https://www.instagram.com/austumzuege/",
		"https://www.tiktok.com/@austumzuege",
		"https://maps.app.goo.gl/z5e8m7QrGPa5Cssp6"
	],
	numberOfEmployees: {
		"@type": "QuantitativeValue",
		value: 7
	},
	founder: {
		"@type": "Person",
		name: "Alex Aust"
	},
	aggregateRating: {
		"@type": "AggregateRating",
		ratingValue: aggregateRating.ratingValue,
		reviewCount: aggregateRating.reviewCount,
		bestRating: 5,
		worstRating: 1
	},
	review: reviews.map((r) => ({
		"@type": "Review",
		url: r.url,
		author: { "@type": "Person", name: r.author },
		datePublished: r.date,
		reviewRating: {
			"@type": "Rating",
			ratingValue: r.rating,
			bestRating: 5,
			worstRating: 1
		},
		reviewBody: r.text
	}))
};

// Slim organization reference for service pages — no embedded reviews array.
// The full businessInfo (with reviews) lives on the homepage only.
// Service pages use this to avoid emitting 6 global reviews that are unrelated to the specific service.
const { review: _omitted, ...businessInfoSlimBase } = businessInfo;
export const businessInfoSlim = businessInfoSlimBase;

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
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
		url: "https://www.aust-umzuege.de/leistungen/privatumzug",
		offers: {
			"@type": "Offer",
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
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
		url: "https://www.aust-umzuege.de/leistungen/firmenumzug",
		offers: {
			"@type": "Offer",
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
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
		url: "https://www.aust-umzuege.de/leistungen/seniorenumzug",
		offers: {
			"@type": "Offer",
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
		areaServed: [{ "@type": "Country", name: "Deutschland" }, { "@type": "AdministrativeArea", name: "Weltweit" }],
		url: "https://www.aust-umzuege.de/leistungen/fern-ueberseeumzug",
		offers: {
			"@type": "Offer",
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
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
		url: "https://www.aust-umzuege.de/leistungen/umzugshelfer",
		offers: {
			"@type": "Offer",
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
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
		url: "https://www.aust-umzuege.de/leistungen/montage",
		offers: {
			"@type": "Offer",
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
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
		url: "https://www.aust-umzuege.de/leistungen/lagerung",
		offers: {
			"@type": "Offer",
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
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
		url: "https://www.aust-umzuege.de/leistungen/halteverbot",
		offers: {
			"@type": "Offer",
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
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
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
		name: "Haushaltsauflösung in Hildesheim",
		description:
			"Diskrete Haushaltsauflösungen in Hildesheim – einfühlsam nach Todesfall oder Pflegeheim-Umzug. Wertanrechnung, besenreine Übergabe, Festpreisgarantie.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
		url: "https://www.aust-umzuege.de/leistungen/haushaltsaufloesung",
		offers: {
			"@type": "Offer",
			priceCurrency: "EUR"
		}
	},
	entruempelung: {
		"@type": "Service",
		serviceType: "Entrümpelung",
		name: "Entrümpelung in Hildesheim",
		description:
			"Professionelle Entrümpelung in Hildesheim – Keller, Dachboden, Garage und Messie-Wohnungen. Festpreis nach kostenloser Besichtigung, besenreine Übergabe.",
		provider: {
			"@id": "https://www.aust-umzuege.de/#organization"
		},
		areaServed: [{ "@type": "City", name: "Hildesheim" }, { "@type": "AdministrativeArea", name: "Niedersachsen" }],
		url: "https://www.aust-umzuege.de/leistungen/entruempelung",
		offers: {
			"@type": "Offer",
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
			"@type": "Person",
			name: "Alex Aust",
			url: "https://www.aust-umzuege.de/impressum"
		},
		publisher: {
			"@type": "Organization",
			"@id": "https://www.aust-umzuege.de/#organization",
			name: "Aust Umzüge & Haushaltsauflösungen",
			logo: {
				"@type": "ImageObject",
				url: "https://www.aust-umzuege.de/LogoName_transparent.webp"
			}
		},
		datePublished: "2026-02-13",
		dateModified: "2026-02-26",
		image: "https://www.aust-umzuege.de/umzuege-haushaltsaufloesungen-hildesheim-umgebung-1024w.webp",
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
			"@type": "Person",
			name: "Alex Aust",
			url: "https://www.aust-umzuege.de/impressum"
		},
		publisher: {
			"@type": "Organization",
			"@id": "https://www.aust-umzuege.de/#organization",
			name: "Aust Umzüge & Haushaltsauflösungen",
			logo: {
				"@type": "ImageObject",
				url: "https://www.aust-umzuege.de/LogoName_transparent.webp"
			}
		},
		datePublished: "2026-02-13",
		dateModified: "2026-02-26",
		image: "https://www.aust-umzuege.de/umziehen-leicht-gemacht-hildesheim-hannover-braunschweig-600w.webp",
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
			"@type": "Person",
			name: "Alex Aust",
			url: "https://www.aust-umzuege.de/impressum"
		},
		publisher: {
			"@type": "Organization",
			"@id": "https://www.aust-umzuege.de/#organization",
			name: "Aust Umzüge & Haushaltsauflösungen",
			logo: {
				"@type": "ImageObject",
				url: "https://www.aust-umzuege.de/LogoName_transparent.webp"
			}
		},
		datePublished: "2026-02-13",
		dateModified: "2026-02-26",
		image: "https://www.aust-umzuege.de/Haushaltsaufloesungen-Entruempelungen-carousel-3-800w.webp",
		url: "https://www.aust-umzuege.de/ratgeber/haushaltsaufloesungen-entruempelungen",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.aust-umzuege.de/ratgeber/haushaltsaufloesungen-entruempelungen"
		},
		articleSection: "Ratgeber"
	},
	serioseUmzugsfirma: {
		"@type": "Article",
		headline: "Woran erkenne ich eine seriöse Umzugsfirma?",
		description:
			"Seriöse Umzugsfirma finden: Erkennen Sie Red Flags, stellen Sie die richtigen Fragen und vermeiden Sie schwarze Schafe.",
		author: {
			"@type": "Person",
			name: "Alex Aust",
			url: "https://www.aust-umzuege.de/impressum"
		},
		publisher: {
			"@type": "Organization",
			"@id": "https://www.aust-umzuege.de/#organization",
			name: "Aust Umzüge & Haushaltsauflösungen",
			logo: {
				"@type": "ImageObject",
				url: "https://www.aust-umzuege.de/LogoName_transparent.webp"
			}
		},
		datePublished: "2026-02-13",
		dateModified: "2026-02-26",
		image: "https://www.aust-umzuege.de/privatumzuege-hildesheim-carousel-1-800w.webp",
		url: "https://www.aust-umzuege.de/ratgeber/seriose-umzugsfirma",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.aust-umzuege.de/ratgeber/seriose-umzugsfirma"
		},
		articleSection: "Ratgeber"
	},
	messieWohnung: {
		"@type": "Article",
		headline: "Messie-Wohnung entrümpeln – Schritt für Schritt selbst machen",
		description:
			"Messie-Wohnung selbst entrümpeln: Praktischer DIY-Ratgeber mit Gesundheits-Check, Sortiersystem, Schutzausrüstung und Entsorgungsplan. Wann Sie lieber Profi-Hilfe holen sollten.",
		author: {
			"@type": "Person",
			name: "Alex Aust",
			url: "https://www.aust-umzuege.de/impressum"
		},
		publisher: {
			"@type": "Organization",
			"@id": "https://www.aust-umzuege.de/#organization",
			name: "Aust Umzüge \u0026 Haushaltsauflösungen",
			logo: {
				"@type": "ImageObject",
				url: "https://www.aust-umzuege.de/LogoName_transparent.webp"
			}
		},
		datePublished: "2026-04-23",
		dateModified: "2026-04-23",
		image: "https://www.aust-umzuege.de/Haushaltsaufloesungen-Entruempelungen-carousel-3-800w.webp",
		url: "https://www.aust-umzuege.de/ratgeber/messie-wohnung-raeumen",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.aust-umzuege.de/ratgeber/messie-wohnung-raeumen"
		},
		articleSection: "Ratgeber"
	},
	moebelEinlagern: {
		"@type": "Article",
		headline: "Möbel einlagern – Kosten, Optionen und was Sie wissen müssen",
		description:
			"Möbel einlagern ab ca. 12 Euro/m²: Welche Lageroptionen es gibt, was sie pro Quadratmeter kosten und wie Sie Ihre Möbel richtig vorbereiten. Praktischer Ratgeber mit Preisübersicht.",
		author: {
			"@type": "Person",
			name: "Alex Aust",
			url: "https://www.aust-umzuege.de/impressum"
		},
		publisher: {
			"@type": "Organization",
			"@id": "https://www.aust-umzuege.de/#organization",
			name: "Aust Umzüge & Haushaltsauflösungen",
			logo: {
				"@type": "ImageObject",
				url: "https://www.aust-umzuege.de/LogoName_transparent.webp"
			}
		},
		datePublished: "2026-04-23",
		dateModified: "2026-04-23",
		image: "https://www.aust-umzuege.de/umzuege-haushaltsaufloesungen-hildesheim-umgebung-1024w.webp",
		url: "https://www.aust-umzuege.de/ratgeber/moebel-einlagern",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.aust-umzuege.de/ratgeber/moebel-einlagern"
		},
		articleSection: "Ratgeber"
	},
	umzugMitKindern: {
		"@type": "Article",
		headline: "Umzug mit Kindern – So meistert Ihre Familie den Wohnungswechsel",
		description:
			"Umzug mit Kindern richtig planen: Altergerechte Vorbereitung, Abschiedsrituale, Schulwechsel in Hildesheim und Tipps für den emotionalen Neuanfang als Familie.",
		author: {
			"@type": "Person",
			name: "Alex Aust",
			url: "https://www.aust-umzuege.de/impressum"
		},
		publisher: {
			"@type": "Organization",
			"@id": "https://www.aust-umzuege.de/#organization",
			name: "Aust Umzüge \u0026 Haushaltsauflösungen",
			logo: {
				"@type": "ImageObject",
				url: "https://www.aust-umzuege.de/LogoName_transparent.webp"
			}
		},
		datePublished: "2026-04-23",
		dateModified: "2026-04-23",
		image: "https://www.aust-umzuege.de/umzuege-haushaltsaufloesungen-hildesheim-umgebung-1024w.webp",
		url: "https://www.aust-umzuege.de/ratgeber/umzug-mit-kindern",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.aust-umzuege.de/ratgeber/umzug-mit-kindern"
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
	numberOfItems: 11,
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
				name: "Entrümpelung",
				url: "https://www.aust-umzuege.de/leistungen/entruempelung"
			}
		},
		{
			"@type": "ListItem",
			position: 8,
			item: {
				"@type": "Service",
				name: "Montage & Demontage",
				url: "https://www.aust-umzuege.de/leistungen/montage"
			}
		},
		{
			"@type": "ListItem",
			position: 9,
			item: {
				"@type": "Service",
				name: "Umzugsberatung",
				url: "https://www.aust-umzuege.de/leistungen/umzugsberatung"
			}
		},
		{
			"@type": "ListItem",
			position: 10,
			item: {
				"@type": "Service",
				name: "Lagerung & Einlagerung",
				url: "https://www.aust-umzuege.de/leistungen/lagerung"
			}
		},
		{
			"@type": "ListItem",
			position: 11,
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
				name: "Woran erkenne ich eine seriöse Umzugsfirma?",
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

// HowTo schemas for rich results
export const howToUmzugsCheckliste = {
	"@type": "HowTo",
	name: "Umzug planen: Die ultimative Checkliste",
	description: "Schritt-für-Schritt-Anleitung für einen stressfreien Umzug in Hildesheim und Umgebung – von 4 Wochen vorher bis 1 Woche danach.",
	step: [
		{
			"@type": "HowToStep",
			name: "4 Wochen vorher: Verträge und Ummeldungen",
			text: "Telefon, Internet, Strom und Gas ummelden oder kündigen. GEZ ummelden, Arbeitgeber und Behörden informieren. Termin zur Wohnungsübergabe vereinbaren."
		},
		{
			"@type": "HowToStep",
			name: "3 Wochen vorher: Material und Reparaturen",
			text: "Umzugsmaterial beschaffen (Kartons, Kleiderboxen, Polsterfolie). Schönheitsreparaturen in der alten Wohnung durchführen. Kinderbetreuung für den Umzugstag organisieren."
		},
		{
			"@type": "HowToStep",
			name: "2 Wochen vorher: Möbel und Halteverbot",
			text: "Renovierung der neuen Wohnung starten. Große Möbel demontieren. Halteverbotszone für den Umzugstag bei der Stadt beantragen."
		},
		{
			"@type": "HowToStep",
			name: "1 Woche vorher: Verpacken und Einkäufe",
			text: "Gardinenstangen und Lampen demontieren. Alles transportsicher verpacken. Letzte Einkäufe für den Umzugstag erledigen."
		},
		{
			"@type": "HowToStep",
			name: "Nach dem Umzug: Montage und Ummeldung",
			text: "Möbel montieren, auspacken und verräumen. Verpackungsmaterial entsorgen. Wohnsitz und KFZ ummelden, Adressänderung bekannt geben, Nachsendeantrag stellen."
		}
	]
};

export const howToVerpackungstipps = {
	"@type": "HowTo",
	name: "Umzugsgut richtig verpacken: Profi-Anleitung",
	description: "Professionelle Verpackungstipps für einen sicheren Umzug – vom richtigen Material über Geschirr und Elektronik bis zu Möbeln und Wertgegenständen.",
	step: [
		{
			"@type": "HowToStep",
			name: "Verpackungsmaterial besorgen",
			text: "Umzugskartons in verschiedenen Größen, Packpapier, Luftpolsterfolie, breites Klebeband, Edding zum Beschriften und Kleiderboxen besorgen."
		},
		{
			"@type": "HowToStep",
			name: "Zimmer für Zimmer einpacken",
			text: "Raum für Raum packen und jeden Karton mit Zimmer und Inhalt beschriften. Mit selten genutzten Räumen beginnen, Küche und Bad zuletzt."
		},
		{
			"@type": "HowToStep",
			name: "Geschirr und Gläser sicher verpacken",
			text: "Jedes Teil einzeln in Papier einwickeln. Teller hochkant wie Schallplatten stellen. Gläser innen und außen polstern. Kartonboden mit zerknülltem Papier auslegen."
		},
		{
			"@type": "HowToStep",
			name: "Elektronik transportsicher machen",
			text: "Fernseher aufrecht in Decke oder Luftpolsterfolie wickeln. Festplatte sichern, Kabel beschriften oder fotografieren. Transportsicherungen bei Druckern aktivieren."
		},
		{
			"@type": "HowToStep",
			name: "Möbel vorbereiten",
			text: "Große Möbel zerlegen, Schrauben in beschriftetem Zip-Beutel am Möbelstück befestigen. Glasböden separat verpacken. Polstermöbel mit Decken schützen."
		}
	]
};

export const howToHaushaltsaufloesung = {
	"@type": "HowTo",
	name: "Haushaltsauflösung planen: Schritt-für-Schritt-Anleitung",
	description: "Praktischer Leitfaden für die komplette Wohnungsräumung – von der Zeitplanung über das Sortieren bis zur fachgerechten Entsorgung.",
	step: [
		{
			"@type": "HowToStep",
			name: "Zeitplanung und Umfang einschätzen",
			text: "Mindestens eine Woche für eine durchschnittliche Wohnung einplanen, bei einem ganzen Haus mit Keller und Dachboden zwei bis drei Wochen. Jeden Raum einzeln durchgehen und den Aufwand realistisch einschätzen."
		},
		{
			"@type": "HowToStep",
			name: "In vier Kategorien sortieren",
			text: "Alle Gegenstände konsequent in vier Kategorien einteilen: Behalten, Verkaufen, Spenden und Entsorgen. Von Anfang an verschiedene Bereiche oder Boxen einrichten, damit nichts durcheinander gerät."
		},
		{
			"@type": "HowToStep",
			name: "Transport organisieren",
			text: "Ab einer Zwei-Zimmer-Wohnung lohnt sich ein Transporter fast immer. Alternativ einen Dienstleister beauftragen. Die Zeitersparnis gegenüber vielen PKW-Fahrten ist erheblich."
		},
		{
			"@type": "HowToStep",
			name: "Fachgerechte Entsorgung durchführen",
			text: "Sperrmüll beim Wertstoffhof abgeben, Elektrogeräte an Sammelstellen bringen, gut erhaltene Dinge an soziale Einrichtungen spenden. Sondermüll wie Farben oder Chemikalien nur an zugelassenen Annahmestellen entsorgen."
		},
		{
			"@type": "HowToStep",
			name: "Professionelle Hilfe prüfen",
			text: "Bei großem Umfang, zeitlicher Einschränkung oder emotionaler Belastung einen professionellen Dienstleister für die Haushaltsauflösung beauftragen. Besenreine Übergabe und fachgerechte Entsorgung inklusive."
		}
	]
};

export const howToSerioseUmzugsfirma = {
	"@type": "HowTo",
	name: "Seriöse Umzugsfirma finden: Anleitung in 5 Schritten",
	description: "So erkennen Sie professionelle Umzugsunternehmen und vermeiden schwarze Schafe – von der Recherche bis zur Vertragsunterzeichnung.",
	step: [
		{
			"@type": "HowToStep",
			name: "Warnsignale erkennen",
			text: "Auf Red Flags achten: 100% Vorkasse, nur Barzahlung ohne Rechnung, unrealistisch niedrige Preise, keine Vor-Ort-Besichtigung und Hochdrucktaktiken wie zeitlich begrenzte Angebote."
		},
		{
			"@type": "HowToStep",
			name: "Qualitätsmerkmale prüfen",
			text: "Auf positive Zeichen achten: transparenter Festpreis nach Besichtigung, gültige Transport- und Haftpflichtversicherung, feste Geschäftsadresse mit Impressum, professionelle Ausrüstung und geschultes Personal."
		},
		{
			"@type": "HowToStep",
			name: "Die richtigen Fragen stellen",
			text: "Beim Erstgespräch gezielt fragen: Ist der Preis ein Festpreis? Welche Versicherungen bestehen? Wie lange existiert die Firma? Kommen die gleichen Mitarbeiter wie bei der Besichtigung? Können Sie Referenzen nennen?"
		},
		{
			"@type": "HowToStep",
			name: "Mehrere Angebote einholen und vergleichen",
			text: "Mindestens drei Angebote einholen. Nicht nur den Preis vergleichen, sondern auch den Leistungsumfang, die Versicherungsleistungen und die Kommunikation. Das billigste Angebot ist selten das beste."
		},
		{
			"@type": "HowToStep",
			name: "Vertrag sorgfältig prüfen",
			text: "Vor Unterzeichnung den Vertrag genau lesen: Sind alle Leistungen aufgeführt? Ist der Festpreis eindeutig? Gibt es eine Stornierungsklausel? Sind Versicherungsdetails genannt? Erst unterschreiben, wenn alles klar ist."
		}
	]
};

export const howToMessieWohnung = {
	"@type": "HowTo",
	name: "Messie-Wohnung selbst entrümpeln: Schritt-für-Schritt-Anleitung",
	description: "Praktischer DIY-Leitfaden für die Entrümpelung einer Messie-Wohnung – mit Gesundheits-Check, Schutzausrüstung, Sortiersystem und Entsorgungsplan.",
	step: [
		{
			"@type": "HowToStep",
			name: "Wohnung auf Machbarkeit prüfen",
			text: "Vor dem Betreten alle Fenster öffnen und 30 Minuten durchlüften. Auf Schimmel, Fäulnis, Chemikalienlachen oder Tierkot prüfen. Bei Bio- oder Chemiegefahren sofortigen Abbruch des DIY-Vorhabens erwägen und professionelle Hilfe bevorzugen."
		},
		{
			"@type": "HowToStep",
			name: "Schutzausrüstung besorgen und anlegen",
			text: "FFP2-Maske, Einweg-Overall, Gummihandschuhe, Schutzbrille, feste Arbeitsschuhe und 120-Liter-Müllsäcke beschaffen. Keine bloßen Hände oder offenen Schuhe. Schutzausrüstung ist Pflicht, kein Luxus."
		},
		{
			"@type": "HowToStep",
			name: "Systematisch nach Vier-Kategorien-System sortieren",
			text: "Gänge freilegen, dann Raum für Raum arbeiten. Jedes Teil in eine von vier Kategorien einteilen: Behalten, Verkaufen/Verschenken, Recycling/Wertstoffhof, Restmüll. Emotionale Gegenstände in gesonderte Kiste legen – nicht sofort sortieren."
		},
		{
			"@type": "HowToStep",
			name: "Transport und fachgerechte Entsorgung organisieren",
			text: "Elektrogeräte, Metalle und Sondermüll getrennt sammeln. Wertstoffhof-Touren planen oder Transporter für 50-80 Euro pro Tag mieten. Sozialkaufhäuser vorher anrufen für Spendenabholung. Farben und Chemikalien nur an zugelassenen Annahmestellen abgeben."
		},
		{
			"@type": "HowToStep",
			name: "Grundreinigung und Belüftung",
			text: "Leere Räume gründlich saugen und mit Soda-Lösung oder essigbasiertem Reiniger wischen. Intensiv lüften. Bei hartnäckigen Gerüchen nicht mit starken Chemikalien arbeiten. Besenreine Übergabe für Vermieter dokumentieren."
		}
	]
};

export const howToMoebelEinlagern = {
	"@type": "HowTo",
	name: "Möbel richtig einlagern: Schritt-für-Schritt-Anleitung",
	description: "Praktischer Leitfaden zur sicheren Zwischenlagerung von Möbeln – von der Auswahl der richtigen Lageroption bis zur Schadensfreien Entnahme.",
	step: [
		{
			"@type": "HowToStep",
			name: "Lagervolumen ermitteln und Lösung wählen",
			text: "Inhalt einer Zweiraumwohnung entspricht ca. 8–10 m² Lagerfläche. Preise pro Quadratmeter variieren stark: bei kurzfristiger Lagerung oft 22–28 Euro/m², bei Jahresbindung teilweise unter 15 Euro/m². Für wertvolle Möbel oder Lagerdauer über 6 Monate ist eine klimatisierte Lösung empfehlenswert."
		},
		{
			"@type": "HowToStep",
			name: "Möbel reinigen und vollständig trocknen",
			text: "Alle Möbelstücke vor dem Transport gründlich reinigen und mindestens 24 Stunden trocknen lassen. Niemals feuchte oder verschmutzte Möbel einlagern – das zieht Schimmel an. Polstermöbel professionell reinigen lassen."
		},
		{
			"@type": "HowToStep",
			name: "Demontieren, verpacken und kennzeichnen",
			text: "Alles zerlegen, was demontierbar ist. Schrauben in beschriftete Beutel packen und am Möbelstück befestigen. Empfindliche Kanten mit Luftpolsterfolie schützen, Oberflächen mit Möbeldecken umwickeln. Nie Plastik direkt auf Lack oder Leder legen – Feuchtigkeit wird eingeschlossen. Jedes Teil und jede Kiste beschriften."
		},
		{
			"@type": "HowToStep",
			name: "Lagerbedingungen optimieren",
			text: "Möbel nicht direkt an Außenwände stellen – mindestens 10 cm Abstand für Luftzirkulation. Paletten verwenden, um den Bodenkontakt zu vermeiden. Luftentfeuchter aufstellen bei nicht klimatisierten Räumen. Matratzen flach lagern, niemals auf die Kante stellen."
		},
		{
			"@type": "HowToStep",
			name: "Versicherung klären und Vertrag prüfen",
			text: "Hausratversicherung deckt externe Lager meist nicht ab – Einlagerungsversicherung beim Anbieter abschließen oder bei Versicherer nachfragen. Vertrag auf Mindestlaufzeit, Kündigungsfrist und Preisanpassungsklauseln prüfen. Gesamtpreis über die geplante Lagerdauer berechnen."
		}
	]
};

export const howToUmzugMitKindern = {
	"@type": "HowTo",
	name: "Kind auf Umzug vorbereiten: Schritt-für-Schritt-Anleitung",
	description: "Praktischer Leitfaden für Eltern: So bereiten Sie Kinder je nach Alter emotional und organisatorisch auf einen Wohnungswechsel vor – von der Nachricht bis zum ersten Tag in der neuen Stadt.",
	step: [
		{
			"@type": "HowToStep",
			name: "Kind altersgerecht informieren",
			text: "Kleinkinder erst eine Woche vorher informieren, Kindergartenkinder drei bis vier Wochen vorher, Grundschulkinder sechs Wochen und Teenager zehn bis zwölf Wochen. Nie als schlechte Nachricht verkaufen – Kinder nehmen die emotionale Bewertung der Eltern als Maßstab."
		},
		{
			"@type": "HowToStep",
			name: "Kind altersgerecht einbeziehen",
			text: "Kleinkinder brauchen vertraute Rituale und Plüschtiere, die nie in Kisten verschwinden. Kindergartenkinder bemalen ihren eigenen Umzugskarton. Grundschulkinder planen ihr neues Zimmer und tragen Kartons. Teenager entscheiden über Farbe, Möbel und Internetanschluss – Respekt vor ihrem sozialen Netz ist entscheidend."
		},
		{
			"@type": "HowToStep",
			name: "Schulwechsel früh klären",
			text: "Anmeldung beim Schulamt Hildesheim oder direkt an der Wunschschule. Unterlagen vorbereiten: Meldebescheinigung, Zeugnis, Versetzungsbescheinigung, Impfpass. Bei Umzug innerhalb Niedersachsens meist unproblematisch, bei anderem Bundesland können Anpassungsprüfungen nötig sein. Förderbedarf früh beiden Schulen mitteilen."
		},
		{
			"@type": "HowToStep",
			name: "Abschied leben statt verdrängen",
			text: "Abschiedsrundgang zu Lieblingsorten, Abschiedsfest mit den drei bis vier wichtigsten Freunden, Erinnerungskiste mit Steinen, Zweigen und Fotos. Symbolische Übergaben helfen Kleinkindern. Trauer ernst nehmen – gemeinsames Weinen ist therapeutisch, nicht dramatisch."
		},
		{
			"@type": "HowToStep",
			name: "Neuanfang strukturiert angehen",
			text: "Woche 1: Sicherheit durch gleiche Routine. Woche 2: Stadtteil entdecken. Woche 3: Erste soziale Kontakte – Jugendfreizeiteinrichtungen, Vereine, Musikschule. Woche 4: Alte Stadt besuchen, um Brücken zu bauen. Dringend: Kinderzimmer zuerst aufbauen, Erste-Hilfe-Box fürs Kind bereithalten, alte Freundschaften per Videochat pflegen."
		}
	]
};

// Quote request page schema
export const quoteRequestPage = {
	"@type": "WebPage",
	name: "Kostenloses Umzugsangebot anfordern",
	description: "Berechnen Sie Ihr Umzugsvolumen und erhalten Sie ein kostenloses Angebot von Aust Umzüge Hildesheim.",
	url: "https://www.aust-umzuege.de/kostenloses-angebot",
	mainEntity: {
		"@id": "https://www.aust-umzuege.de/#organization"
	},
	potentialAction: {
		"@type": "CommunicateAction",
		target: "https://www.aust-umzuege.de/kostenloses-angebot",
		name: "Kostenloses Umzugsangebot anfordern"
	}
};

// Breadcrumb helper function
export function createBreadcrumbs(items: Array<{ name: string; url?: string }>) {
	return {
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			...(item.url && { item: item.url })
		}))
	};
}
