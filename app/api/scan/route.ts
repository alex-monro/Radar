import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ipAddress } from "@vercel/functions";

import OpenAI from "openai";
import { AxeBuilder } from "@axe-core/playwright";
import { calculateScore } from "@/app/api/scan/lib/calculate-score";
import { getPageSpeedAccessibilityScore } from "@/app/api/scan/lib/pagespeed-score";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(6, "1 h"),
  prefix: "ratelimit:scan",
});

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY,
});

export async function POST(request: Request) {
  const ip = ipAddress(request) ?? "unknown";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json(
      { error: "You've hit the daily scan limit. Try again later." },
      { status: 429 },
    );
  }
  // request.json() always targets the body of the request. In this case, the body is a JSON object with a single key called "url"
  const { url } = await request.json();
  const client = new OpenAI();

  // chromium.launch() is a playwright function that opens a new brawser window. This is the same as opening a new browser window on your computer.
  // The "await" keyword means "wait for this to finish before moving on"
  const session = await bb.sessions.create();
  // connectOverCDP is a playwright function that connects to a browser instance over CDP (Chrome DevTools Protocol).
  const browser = await chromium.connectOverCDP(session.connectUrl);

  try {
    // AxeBuilder needs an explicit context (not the implicit one browser.newPage() creates on its own)
    const context = await browser.newContext();
    const page = await context.newPage();
    // Go to this specific Url. This is the same as typing a URL into the address bar of your browser and hitting enter.
    await page.goto(url, { timeout: 30000 });
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
            "You are explaining a website accessibility scan to someone with no technical background, like a small business owner or marketer. Write a brief, plain-language overview of the issues found. Do not list every issue individually or use technical terms like 'ARIA', 'contrast ratio', or 'DOM'. Instead, group similar problems together and describe them in everyday language. For each, briefly explain who it affects (for example, people using screen readers, or people with low vision) and why it matters to them. Do not explain how to fix anything. Do not use em dashes. Keep the tone plain and direct, and keep the whole summary under 150 words.",
        },
        {
          role: "user",
          content: `Here are the accessibility issues found on ${url}:\n\n${issues}`,
        },
      ],
    });

    const summary = response.output_text;
    // Real, published methodology first (Google's own hosted Lighthouse run);
    // fall back to our own axe-core-based formula only if that call fails,
    // so a PageSpeed outage never means "no score at all."
    const score =
      (await getPageSpeedAccessibilityScore(url)) ?? calculateScore(results);

    // Response.json() is a Next.js function that returns a JSON response to the client. In this case, the response is the results of the accessibility scan.
    return Response.json({ results, screenshot, summary, score });
  } catch (error) {
    console.error("Error during scan:", error);
    return Response.json(
      { error: "An error occurred during the scan." },
      { status: 500 },
    );
  } finally {
    await browser.close();
  }
}
