# 🚦 Lighthouse Testing Guide

Run Lighthouse performance audits locally before deploying to catch issues early.

## Quick Start

```bash
# Run full Lighthouse audit (Desktop)
npm run lighthouse

# Run Lighthouse audit for Mobile
npm run lighthouse:mobile

# Open the latest report in your browser
npm run lighthouse:open
```

## What Gets Tested

The following pages are audited:
- Homepage (`/`)
- Leistungen overview (`/leistungen`)
- Privatumzug service (`/leistungen/privatumzug`)
- Ratgeber overview (`/ratgeber`)
- Kontakt page (`/kontakt`)

Each page is tested **3 times** and averaged for accuracy.

## Performance Thresholds

The build will **warn** or **error** if these thresholds aren't met:

| Category | Min Score | Level |
|----------|-----------|-------|
| Performance | 85% | Error |
| Accessibility | 90% | Warn |
| Best Practices | 90% | Warn |
| SEO | 90% | Warn |

### Specific Metrics

| Metric | Max Value | Level |
|--------|-----------|-------|
| First Contentful Paint (FCP) | 2.0s | Warn |
| Largest Contentful Paint (LCP) | 2.5s | Warn |
| Cumulative Layout Shift (CLS) | 0.1 | Error |
| Total Blocking Time (TBT) | 300ms | Warn |

## Understanding Results

### Performance Score Breakdown
- **90-100**: Excellent ✅
- **50-89**: Needs improvement ⚠️
- **0-49**: Poor ❌

### Common Issues & Fixes

#### 1. Low Performance Score
**Causes:**
- Large images not optimized
- Render-blocking JavaScript
- Unused CSS

**Fixes:**
- Use responsive images with srcset
- Defer non-critical JS
- Remove unused styles

#### 2. Poor Accessibility Score
**Causes:**
- Missing alt text on images
- Low color contrast
- Missing ARIA labels

**Fixes:**
- Add descriptive alt attributes
- Use WCAG AA compliant colors (4.5:1 ratio)
- Add proper ARIA attributes

#### 3. Forced Reflow
**Causes:**
- Reading layout properties after DOM changes
- CSS transitions triggering layout

**Fixes:**
- Use translate3d() instead of translateY()
- Add will-change hints
- Use CSS containment

## Configuration

Edit `lighthouserc.cjs` to:
- Change tested URLs
- Adjust thresholds
- Add/remove assertions
- Change mobile/desktop preset

### Example: Test Different Pages

```javascript
url: [
  'http://localhost:4173/',
  'http://localhost:4173/leistungen/firmenumzug',
  'http://localhost:4173/ratgeber/seriose-umzugsfirma',
],
```

### Example: Stricter Thresholds

```javascript
assertions: {
  'categories:performance': ['error', { minScore: 0.95 }],
  'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
},
```

## CI/CD Integration

### Option 1: Pre-commit Hook
Run Lighthouse before every commit:

```bash
# In .husky/pre-commit
npm run lighthouse
```

### Option 2: GitHub Actions
Run on every PR (see `.github/workflows/lighthouse.yml`)

### Option 3: Netlify Plugin
Already configured via `netlify.toml` - runs on deployment

## Reports

Reports are saved to `./lighthouse-reports/`:
- `index.html` - Summary of all runs
- Individual JSON files per URL/run

**Note:** Reports are gitignored (don't commit them)

## Troubleshooting

### "Port 4173 is already in use"
Kill the preview server:
```bash
lsof -ti:4173 | xargs kill -9
```

### "No pages found"
Make sure the build completed:
```bash
npm run build
```

### Inconsistent scores
Run more times for better average:
```javascript
numberOfRuns: 5,  // in lighthouserc.cjs
```

## Best Practices

✅ **Run before pushing** - Catch issues locally
✅ **Test on mobile** - Most traffic is mobile
✅ **Check all key pages** - Not just homepage
✅ **Review reports** - Don't just look at scores
✅ **Fix regressions** - Don't let scores drop

## Resources

- [Lighthouse Docs](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Performance Budget](https://web.dev/performance-budgets-101/)

---

**Pro Tip:** Run `npm run lighthouse` after making performance changes to verify improvements before deploying! 🚀
