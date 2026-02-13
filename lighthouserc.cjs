// Lighthouse CI Configuration for Aust Umzüge
// Run with: npm run lighthouse

module.exports = {
  ci: {
    collect: {
      // URLs to test - ALL PAGES
      url: [
        // Main pages
        'http://localhost:4173/',
        'http://localhost:4173/kontakt',
        'http://localhost:4173/kostenloses-angebot',

        // Leistungen
        'http://localhost:4173/leistungen',
        'http://localhost:4173/leistungen/privatumzug',
        'http://localhost:4173/leistungen/firmenumzug',
        'http://localhost:4173/leistungen/fern-ueberseeumzug',
        'http://localhost:4173/leistungen/seniorenumzug',
        'http://localhost:4173/leistungen/umzugshelfer',
        'http://localhost:4173/leistungen/halteverbot',
        'http://localhost:4173/leistungen/umzugsberatung',
        'http://localhost:4173/leistungen/montage',
        'http://localhost:4173/leistungen/haushaltsaufloesung',
        'http://localhost:4173/leistungen/lagerung',

        // Ratgeber
        'http://localhost:4173/ratgeber',
        'http://localhost:4173/ratgeber/umzugs-checkliste',
        'http://localhost:4173/ratgeber/verpackungstipps',
        'http://localhost:4173/ratgeber/haushaltsaufloesungen-entruempelungen',
        'http://localhost:4173/ratgeber/seriose-umzugsfirma',

        // Legal
        'http://localhost:4173/impressum',
        'http://localhost:4173/datenschutz',
        'http://localhost:4173/agb',
        'http://localhost:4173/cookie-einstellungen',
      ],
      // Number of runs per URL (1 for speed during debugging)
      numberOfRuns: 1,
      // Settings
      settings: {
        preset: 'desktop', // or 'mobile'
      },
    },
    assert: {
      // Assertions - fail build if these thresholds aren't met
      assertions: {
        // Performance
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Specific metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      // Store reports locally
      target: 'filesystem',
      outputDir: './lighthouse-reports',
    },
  },
};
