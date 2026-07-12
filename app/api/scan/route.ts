import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

export async function POST(request: Request) {
  // request.json() always targets the body of the request. In this case, the body is a JSON object with a single key called "url"
  const { url } = await request.json();

  // chromium.launch() is a playwright function that opens a new brawser window. This is the same as opening a new browser window on your computer.
  // The "await" keyword means "wait for this to finish before moving on"
  const browser = await chromium.launch();
  try {
    // AxeBuilder needs an explicit context (not the implicit one browser.newPage() creates on its own)
    const context = await browser.newContext();
    const page = await context.newPage();
    // Go to this specific Url. This is the same as typing a URL into the address bar of your browser and hitting enter.
    await page.goto(url);
    // new AxeBuilder({ page }) is a function that runs the axe-core accessibility scanner on the page.
    // The "analyze()" function runs the scan and returns the results.
    const results = await new AxeBuilder({ page }).analyze();
    // Response.json() is a Next.js function that returns a JSON response to the client. In this case, the response is the results of the accessibility scan.
    return Response.json(results);
  } finally {
    await browser.close();
  }
}
