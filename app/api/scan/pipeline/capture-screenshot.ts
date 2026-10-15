import type { Page } from "playwright-core";
import type { PageDimensions } from "@/app/types";

// The default is 30s, which a tall page can exceed on encoding alone.
const SCREENSHOT_TIMEOUT_MS = 60000;

// A screenshot is the nicest part of the result but it is not the result.
// axe findings, the summary and the score are all still worth returning if
// the capture is slow or fails, so this degrades to null rather than
// throwing away an otherwise complete scan.
export const captureScreenshot = async (
  page: Page,
  url: string,
  dimensions: PageDimensions,
): Promise<string | null> => {
  const captureStarted = Date.now();
  console.log(
    `Capturing ${url} at ${dimensions.width}x${dimensions.height} css px`,
  );
  try {
    const screenshotdata = await page.screenshot({
      // fullPage is the only way to capture past the viewport. `clip` cannot
      // substitute for it: the two are mutually exclusive in Playwright, and
      // clip's coordinates are viewport-relative, so clipping alone silently
      // returns just the top of the page.
      fullPage: true,
      // Stops CSS animations and transitions from preventing the page from
      // ever settling into a stable frame.
      animations: "disabled",
      // Capture at CSS pixel size, not the device pixel ratio. A remote
      // browser running at deviceScaleFactor 2 would otherwise produce four
      // times the pixel data, all of which has to be encoded and then sent
      // back over CDP. The image is only used to locate issues on a page, so
      // retina detail buys nothing here.
      scale: "css",
      // JPEG rather than PNG. Lossless compression of a full-page website
      // capture is enormous, and this image is a map, not a document. The
      // saving is in encode time, transfer time, and the client's
      // sessionStorage budget all at once.
      type: "jpeg",
      quality: 80,
      timeout: SCREENSHOT_TIMEOUT_MS,
    });
    const screenshot = screenshotdata.toString("base64");
    console.log(
      `Captured in ${Date.now() - captureStarted}ms, ${Math.round(
        screenshot.length / 1024,
      )}kb base64`,
    );
    return screenshot;
  } catch (err) {
    console.error(
      `Screenshot failed after ${Date.now() - captureStarted}ms, continuing without one:`,
      err,
    );
    return null;
  }
};
