import type { Page } from "playwright-core";
import type { PageDimensions } from "@/app/types";

// Roughly 50 viewport heights. Enough to trigger lazy loading on any real
// page, while guaranteeing the pre-screenshot scroll always terminates.
const MAX_SCROLL_STEPS = 50;

// Returns false when the site answers with an error status, which in practice
// means it refuses automated visitors.
export const openUrl = async (page: Page, url: string): Promise<boolean> => {
  const response = await page.goto(url, { timeout: 30000 });
  if (response && response.status() >= 400) return false;
  await page.waitForTimeout(3000);
  return true;
};

// Scroll through the whole page once, then jump back to the top. Without
// this, the full-page screenshot itself triggers lazy loading: the page
// grows while it's being captured, and the positions measured below no
// longer line up with the image. That's what made highlight boxes drift
// or spill past the bottom of the screenshot on some sites.
//
// The loop is bounded on purpose. Reading scrollHeight fresh each pass
// means lazy loading extends the page as we scroll, which pushes the exit
// condition further away every iteration. On a site that keeps appending
// content that loop effectively never ends. MAX_SCROLL_STEPS caps it.
//
// Measured before the screenshot so the capture can be clipped to a sane
// height. The results page treats the loaded image's natural size as the
// real source of truth anyway, so a clipped capture stays aligned.
export const scrollAndMeasure = async (
  page: Page,
): Promise<PageDimensions> => {
  await page.evaluate(async (maxSteps) => {
    const step = window.innerHeight;
    for (let i = 0; i < maxSteps; i++) {
      const y = i * step;
      if (y >= document.documentElement.scrollHeight) break;
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo(0, 0);
  }, MAX_SCROLL_STEPS);
  await page.waitForTimeout(500);

  return page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
};
