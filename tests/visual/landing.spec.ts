import { test, expect, type Page } from "@playwright/test";

/**
 * Visual regression for the MITAN landing page.
 *
 * Matrix:
 *   locales:   EN, ID
 *   viewports: desktop (1366), mobile (390)  — configured in playwright.config.ts projects
 *   shots:     full-page + per-section (nav, hero, trust, founder, how, who, cta, faq, footer)
 *
 * Total per Playwright project: 2 locales × (1 full-page + 9 section shots) = 20 snapshots.
 * Across both projects (desktop + mobile): 40 snapshots per run.
 *
 * Determinism:
 *   - Web fonts are awaited before the first shot.
 *   - `.reveal` elements are forced into the `.in` state so IntersectionObserver
 *     timing doesn't make sections blank in full-page captures.
 *   - The fixed mobile sticky CTA is hidden so it doesn't overlay every shot.
 *   - Animations & carets are disabled via playwright.config.ts.
 */

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "id", label: "ID" },
] as const;

const SECTIONS = [
  { id: "nav", selector: "header" },
  { id: "hero", selector: "#top" },
  { id: "trust", selector: "section.bg-paper-alt:not(#how):not(#faq)" },
  { id: "founder", selector: "#founder" },
  { id: "how", selector: "#how" },
  { id: "who", selector: "main > section:not([id]):not(.bg-paper-alt):not(.bg-primary)" },
  { id: "cta", selector: "main > section.bg-primary" },
  { id: "faq", selector: "#faq" },
  { id: "footer", selector: "footer" },
] as const;

async function prepareLanding(page: Page, locale: "en" | "id") {
  // Seed locale BEFORE the app boots so i18next-browser-languagedetector picks it up.
  await page.addInitScript((lang) => {
    try {
      window.localStorage.setItem("i18nextLng", lang);
    } catch {
      /* sandboxed iframes */
    }
  }, locale);

  await page.goto("/", { waitUntil: "networkidle" });

  // Wait for web fonts (Lora + Inter) so headings don't swap mid-snapshot.
  await page.evaluate(async () => {
    if ("fonts" in document) await (document as Document).fonts.ready;
  });

  // Force every scroll-reveal element into its final state.
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      el.style.transitionDelay = "0ms";
      el.classList.add("in");
    });
    // Hide the mobile sticky CTA so it doesn't overlay every section.
    document
      .querySelectorAll<HTMLElement>(".md\\:hidden.fixed.bottom-0")
      .forEach((el) => {
        el.style.display = "none";
      });
    // Hide the offline / install banners from PwaShell if they ever surface.
    document
      .querySelectorAll<HTMLElement>(".fixed.top-0.inset-x-0.z-50.bg-amber-500")
      .forEach((el) => (el.style.display = "none"));
  });

  // One frame to let layout settle after our DOM tweaks.
  await page.waitForTimeout(150);
}

for (const locale of LOCALES) {
  test.describe(`landing — ${locale.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await prepareLanding(page, locale.code);
    });

    test(`full-page snapshot (${locale.label})`, async ({ page }) => {
      await expect(page).toHaveScreenshot(`landing-${locale.code}-full.png`, {
        fullPage: true,
      });
    });

    for (const section of SECTIONS) {
      test(`section: ${section.id} (${locale.label})`, async ({ page }) => {
        const target = page.locator(section.selector).first();
        await target.waitFor({ state: "visible" });
        await target.scrollIntoViewIfNeeded();
        // Re-run a microtick so any layout shift from scroll settles.
        await page.waitForTimeout(100);
        await expect(target).toHaveScreenshot(
          `landing-${locale.code}-${section.id}.png`,
        );
      });
    }
  });
}
