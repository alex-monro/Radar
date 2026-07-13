import { chromium } from "playwright";

import OpenAI from "openai";
import { AxeBuilder } from "@axe-core/playwright";

export async function POST(request: Request) {
  // request.json() always targets the body of the request. In this case, the body is a JSON object with a single key called "url"
  const { url } = await request.json();
  const client = new OpenAI();

  // chromium.launch() is a playwright function that opens a new brawser window. This is the same as opening a new browser window on your computer.
  // The "await" keyword means "wait for this to finish before moving on"
  const browser = await chromium.launch();

  try {
    // AxeBuilder needs an explicit context (not the implicit one browser.newPage() creates on its own)
    const context = await browser.newContext();
    const page = await context.newPage();
    // Go to this specific Url. This is the same as typing a URL into the address bar of your browser and hitting enter.
    await page.goto(url);
    //playwright has a built in screenshot function we are using here
    const screenshotdata = await page.screenshot({ fullPage: true });
    const screenshot = screenshotdata.toString("base64");
    // new AxeBuilder({ page }) is a function that runs the axe-core accessibility scanner on the page.
    // The "analyze()" function runs the scan and returns the results.
    const results = await new AxeBuilder({ page }).analyze();
    const issues = results?.violations
      .map(
        (violation) =>
          `Violation Impact: ${violation.impact} Violation Description: ${violation.description} Number of elements affected: ${violation.nodes.length} `,
      )
      .join("\n");
    const response = await client.responses.create({
      model: "gpt-5.6",
      input: [
        {
          role: "developer",
          content:
            "You are an accessibility expert summarizing a website scan for a non-technical reader. Write one short-to-medium paragraph at a grade-3 reading level: simple words, short sentences. Cover the main problems and why they matter to real visitors (who is affected, e.g. screen reader users, low-vision users, keyboard-only users). Do not mention CSS selectors, rule IDs, or other technical jargon. No bullet points.",
        },
        {
          role: "user",
          content: `Here are the accessibility issues found on ${url}:\n\n${issues}`,
        },
      ],
    });

    const summary = response.output_text;
    console.log("summary", summary);

    // Response.json() is a Next.js function that returns a JSON response to the client. In this case, the response is the results of the accessibility scan.
    return Response.json({ results, screenshot, summary });
  } finally {
    await browser.close();
  }
}
