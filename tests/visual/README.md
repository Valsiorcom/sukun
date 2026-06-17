# Visual Regression Tests

Snapshot tests for the MITAN landing page using `@playwright/test`'s built-in
`toHaveScreenshot` pixel diff.

## What's covered

- **Routes:** `/` (landing)
- **Locales:** EN and ID (seeded via `localStorage.i18nextLng` before app boot)
- **Viewports:** desktop (1366×768) and mobile (390×844)
- **Shots:** full-page + 9 per-section captures
  (nav, hero, trust, founder, how, who, cta, faq, footer)

Per Playwright project: 20 snapshots. Across desktop + mobile: **40 snapshots / run**.

## Commands

First-time setup (download browser binaries):

```bash
bunx playwright install --with-deps chromium
```

Run the suite (Playwright auto-starts `bun run dev`):

```bash
bun run test:visual
```

Update baselines after an intentional UI change. **Review the diff before committing.**

```bash
bun run test:visual:update
```

Open the HTML report (failures include before/after/diff PNGs):

```bash
bunx playwright show-report
```

## Baselines

Baseline PNGs are written next to the spec under
`tests/visual/__screenshots__/landing.spec.ts/` and are committed to the repo.
Two folders are produced — one per Playwright project
(`desktop-chromium` and `mobile-chromium`).

## Determinism notes

- Fonts (Lora + Inter) are awaited via `document.fonts.ready` before the first shot.
- Scroll-reveal elements (`[data-reveal]`) are forced into the `.in` state so
  `IntersectionObserver` timing doesn't blank out sections during full-page captures.
- The fixed mobile sticky CTA and the PWA offline banner are hidden so they
  don't overlay every section shot.
- Animations and text carets are disabled globally in `playwright.config.ts`.
- A small `maxDiffPixelRatio` (1%) absorbs font/AA drift between machines.

## Wiring to CI later

Run on every PR/push to main with a workflow like:

```yaml
# .github/workflows/visual.yml
name: visual
on: [push, pull_request]
jobs:
  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx playwright install --with-deps chromium
      - run: bun run test:visual
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

Baselines must be generated on the same OS/CPU family as CI (usually Linux)
or you'll see persistent font-rendering diffs. Generate them inside the same
container with `bun run test:visual:update` and commit the PNGs.
