// Lighthouse CI Configuration for Aust Umzüge
// Run with: npm run lighthouse

module.exports = {
  ci: {
    collect: {
      // URLs to test (adjust port if needed)
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/leistungen',
        'http://localhost:4173/leistungen/privatumzug',
        'http://localhost:4173/ratgeber',
        'http://localhost:4173/kontakt',
      ],
      // Number of runs per URL (more runs = more accurate)
      numberOfRuns: 3,
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

        // No forced reflows
        'no-unload-listeners': 'error',
        'uses-passive-event-listeners': 'warn',
      },
    },
    upload: {
      // Store reports locally
      target: 'filesystem',
      outputDir: './lighthouse-reports',
    },
  },
};
