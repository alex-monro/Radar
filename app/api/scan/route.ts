import { chromium } from "playwright-core";
import { Hyperbrowser } from "@hyperbrowser/sdk";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ipAddress } from "@vercel/functions";

import OpenAI from "openai";
import { AxeBuilder } from "@axe-core/playwright";
import { calculateScore } from "@/app/api/scan/lib/calculate-score";
import { getPageSpeedAccessibilityScore } from "@/app/api/scan/lib/pagespeed-score";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  // TEMP for dev testing: bumped way up from the real limit (6/hour) so
  // repeated manual testing doesn't get blocked. Drop this back to 6 before
  // this goes live for real.
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  prefix: "ratelimit:scan",
});

const hb = new Hyperbrowser({
  apiKey: process.env.HYPERBROWSER_API_KEY,
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
  const scorePromise = getPageSpeedAccessibilityScore(url);
  const client = new OpenAI();

  // Start the remote browser session. The free Hyperbrowser plan allows only
  // ONE concurrent session, so if another scan is already running this throws.
  // Catch it and return a clear "busy" message the UI can show, instead of a
  // generic 500. There is no session to clean up if this call itself fails.
  let session;
  try {
    session = await hb.sessions.create({
      useStealth: true,
    });
  } catch (err) {
    console.error("Could not start a browser session:", err);
    return Response.json(
      {
        error:
          "The scanner is busy right now. Please wait a few seconds and try again.",
      },
      { status: 503 },
    );
  }

  // browser is declared here but connected INSIDE the try below, so that if the
  // connection fails the finally still runs and releases the session. A session
  // left open would block every future scan on the one-session plan.
  let browser;
  try {
    // connectOverCDP connects Playwright to the remote browser over CDP.
    browser = await chromium.connectOverCDP(session.wsEndpoint);
    // Hyperbrowser already gives the session a context and page, so use the
    // existing context rather than browser.newContext() (which isn't the right
    // pattern over a CDP connection). AxeBuilder just needs a page.
    const context = browser.contexts()[0];
    const page = await context.newPage();
    // Go to this specific Url. This is the same as typing a URL into the address bar of your browser and hitting enter.
    await page.goto(url, { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Scroll through the whole page once, then jump back to the top. Without
    // this, the full-page screenshot itself triggers lazy loading: the page
    // grows while it's being captured, and the positions measured below no
    // longer line up with the image. That's what made highlight boxes drift
    // or spill past the bottom of the screenshot on some sites.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);

    //playwright has a built in screenshot function we are using here
    const screenshotdata = await page.screenshot({ fullPage: true });
    const screenshot = screenshotdata.toString("base64");
    // new AxeBuilder({ page }) is a function that runs the axe-core accessibility scanner on the page.
    // The "analyze()" function runs the scan and returns the results.
    const results = await new AxeBuilder({ page }).analyze();
    // Full page size, used by the results page to place each highlight box as a
    // percentage of the screenshot. Must be returned alongside findings.
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));
    const findings = [];
    let number = 1;
    for (const violation of results.violations) {
      const selectors = violation.nodes
        .map((n) => n.target[0])
        .filter((s): s is string => typeof s === "string");

      const boxes = await page.evaluate((sels) => {
        return sels.map((sel) => {
          let el;
          try {
            el = document.querySelector(sel);
          } catch {
            return null;
          }
          if (!el) return null;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return null;

          return {
            x: r.left + window.scrollX,
            y: r.top + window.scrollY,
            width: r.width,
            height: r.height,
          };
        });
      }, selectors);

      findings.push({
        number: number++,
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        description: violation.description,
        helpUrl: violation.helpUrl,
        selectors,
        boxes: boxes.filter(Boolean),
      });
    }
    const issues = results?.violations
      .map(
        (violation) =>
          `Violation Impact: ${violation.impact} Violation Description: ${violation.description} Number of elements affected: ${violation.nodes.length} `,
      )
      .join("\n");
    // On a clean scan there are no issues to summarize, so skip the AI call
    // entirely rather than sending it an empty issues list (which previously
    // made it respond as if it needed more input instead of confirming a
    // clean result).
    const summary =
      results.violations.length === 0
        ? "No significant accessibility issues were found in this scan."
        : (
            await client.responses.create({
              model: "gpt-5.6",
              input: [
                {
                  role: "developer",
                  content:
                    "Explain this website accessibility scan to someone with no technical background, like a small business owner. Write at a grade-3 reading level, in plain warm prose, two to four short sentences. No bullet points, no bold, no headers, no markdown. Never ask for more information or describe what you would do, you already have everything you need, always produce the actual summary. If issues are few or minor, say so plainly rather than sounding alarming. If there are many or serious issues, be honest and direct without being harsh. Group similar problems together in everyday language, never terms like 'ARIA', 'contrast ratio', or 'DOM'. For each group, say who it affects (for example, people using screen readers) and why it matters to them in concrete terms. Do not explain how to fix anything. Do not use em dashes. Never say 'audit' or 'certified'. Keep the whole summary under 150 words.",
                },
                {
                  role: "user",
                  content: `Here are the accessibility issues found on ${url}:\n\n${issues}`,
                },
              ],
            })
          ).output_text;
    // Real, published methodology first (Google's own hosted Lighthouse run);
    // fall back to our own axe-core-based formula only if that call fails,
    // so a PageSpeed outage never means "no score at all."

    const score = (await scorePromise) ?? calculateScore(results);
    // Response.json() is a Next.js function that returns a JSON response to the client. In this case, the response is the results of the accessibility scan.
    return Response.json({
      results,
      screenshot,
      summary,
      score,
      findings,
      dimensions,
    });
  } catch (error) {
    console.error("Error during scan:", error);
    return Response.json(
      { error: "An error occurred during the scan." },
      { status: 500 },
    );
  } finally {
    // Always release the connection and the remote session, and guard each so a
    // failure in one never skips the other. Stopping the session is what frees
    // the single concurrent slot for the next scan.
    try {
      if (browser) await browser.close();
    } catch (e) {
      console.error("browser.close() failed:", e);
    }
    try {
      await hb.sessions.stop(session.id);
    } catch (e) {
      console.error("session stop failed:", e);
    }
  }
}
