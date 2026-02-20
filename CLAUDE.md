# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static portfolio site for dhcrain.com, converted from a WordPress/Beaver Builder site. The goal is a pixel-faithful reproduction of the original site as a standalone HTML/CSS/JS site, without the WordPress CMS.

The live original site is at `https://dhcrain.com/`. The static version is `index.html` served directly from the file system.

## Commands

```bash
# Run all Playwright tests
npm test

# Run a single test file
npx playwright test tests/compare.spec.js
npx playwright test tests/measure.spec.js
npx playwright test tests/pixeldiff.spec.js

# Run a single test by name
npx playwright test --grep "measure section heights"
```

Tests require Playwright browsers to be installed (`npx playwright install chromium`). Screenshots are saved to `screenshots/` (gitignored).

## CSS architecture

The site uses four CSS files loaded in this order in `index.html`:

1. **`css/layout.css`** — Beaver Builder layout primitives: `.fl-row`, `.fl-col`, `.fl-col-group`, clearfix helpers, visibility classes. Do not change semantics here.
2. **`css/skin.css`** — Beaver Builder theme skin (typography, colors, global element styles). Treat as read-only reference.
3. **`css/sections.css`** — Per-section styles migrated from Beaver Builder's inline `fl-node-*` rules. Contains semantic class names like `.hero-section`, `.design-section`, column width helpers (`.col-third`, `.col-seventh`), and nav menu styles.
4. **`css/custom.css`** — Custom overrides: fixed header, hero layout, CTA button, button styles, responsive breakpoints. This is the primary file for new styles.

**Key classes to know:**
- `.fl-row` / `.fl-col-group` / `.fl-col` — Beaver Builder layout grid (float-based)
- `.hero-section` — Full-viewport-height hero with gray background (`#747d7d`)
- `.fl-page-header-fixed` / `.fl-page-header-fixed-show` — Fixed header, shown via JS scroll listener
- `.hero-nav-list` — In-hero navigation (collapses on mobile via `.fl-menu-open`)
- `.fl-animation.fl-fade-up` / `.fl-fade-down` — CSS animation classes

## Page structure (`index.html`)

Single-page layout with anchor-linked sections:

- `#top` — Hero (full-height, gray, logo, nav, CTA, icons)
- `#more` — "What I do" / About section
- `#fat-hen`, `#cl-clone`, `#url-short` — Portfolio project sections
- `#resume` — Resume / graphic design gallery (Magnific Popup lightbox)
- `#contact` — Contact section
- Fixed `<header class="fl-page-header-fixed">` — shown after scroll

External dependencies (CDN):
- Bootstrap 3.3.7 (grid/utilities)
- Font Awesome 4.7.0
- Magnific Popup 1.1.0 (gallery lightbox)
- Google Fonts: Open Sans

## Test strategy

Tests compare the static `index.html` against the live `https://dhcrain.com/` site:

- **`compare.spec.js`** — Full-page and section-by-section screenshots; logs paths to `screenshots/` for manual inspection. Does not assert pixel equality.
- **`measure.spec.js`** — Measures `.fl-row` heights/positions on both sites and diffs them; useful for catching layout regressions.
- **`pixeldiff.spec.js`** — Uses `pixelmatch` + `pngjs` to generate a diff image and per-section diff percentages.

These tests are visual/diagnostic tools rather than pass/fail CI tests.
