import { chromium } from "playwright-core";
import { Hyperbrowser } from "@hyperbrowser/sdk";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ipAddress } from "@vercel/functions";

import OpenAI from "openai";
import { AxeBuilder } from "@axe-core/playwright";
import { calculateScore } from "@/app/api/scan/lib/calculate-score";
import { getPageSpeedAccessibilityScore } from "@/app/api/scan/lib/pagespeed-score";

import { z } from "zod";

const requestSchema = z.object({
  url: z.httpUrl(),
});

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  // 5 scans per day per IP (PRD story 1.7, NFR1/NFR2). Matches the "daily
  // limit" wording the error responses use. Each scan spins up a remote
  // browser and makes paid API calls, so this cap is what keeps hosting cost
  // bounded against an anonymous, un-authenticated endpoint.
  limiter: Ratelimit.slidingWindow(5, "24 h"),
  prefix: "ratelimit:scan",
});

const hb = new Hyperbrowser({
  apiKey: process.env.HYPERBROWSER_API_KEY,
});

// A full scan (remote browser load + scroll + screenshot + axe + AI summary)
// can run well past Vercel's default 60s serverless limit. Raise it so slow
// sites don't time out in production. 300s is the Fluid Compute ceiling on
// Hobby (Fluid is on by default); billing is by active CPU, and most of a
// scan is spent waiting on the network, which is not billed.
export const maxDuration = 300;

// Roughly 50 viewport heights. Enough to trigger lazy loading on any real
// page, while guaranteeing the pre-screenshot scroll always terminates.
const MAX_SCROLL_STEPS = 50;

// The default is 30s, which a tall page can exceed on encoding alone.
const SCREENSHOT_TIMEOUT_MS = 60000;

export async function POST(request: Request) {
  const ip = ipAddress(request) ?? "unknown";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json(
      { error: "You've hit the daily scan limit. Try again later." },
      { status: 429 },
    );
  }
  // don't know what this is yet. basically, it needs to get defined later down the line.
  //any is basically a bypass for type checking.
  // we use unknow because later down the line we define what an aspect of the body requst is
  // with the schema we built with zod.
  let body: unknown;
  // request.json() always targets the body of the request. In this case, the body is a JSON object with a single key called "url"
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  //instead of directly detructuring the url from the body, we first validate the body using zod. This is a safer approach because it ensures that the body has the correct structure and types before we try to use it. If the validation fails, we return a 400 error with a message indicating that the request body is invalid.
  const parseResult = requestSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json(
      { error: "Invalid request body. Must include a valid URL." },
      { status: 400 },
    );
  }
  const { url } = parseResult.data;
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

  // If the visitor closes the tab or navigates away mid-scan, the browser
  // aborts the request. Without this the handler keeps running to completion,
  // holding the single Hyperbrowser session for the full scan and blocking the
  // next visitor with a "busy" message. Stopping the session the moment the
  // request aborts frees the slot immediately; it also drops the CDP
  // connection, so the in-flight Playwright call rejects and unwinds cleanly
  // through the catch/finally below.
  const onAbort = () => {
    hb.sessions.stop(session.id).catch(() => {});
  };
  request.signal.addEventListener("abort", onAbort);

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
    //
    // The loop is bounded on purpose. Reading scrollHeight fresh each pass
    // means lazy loading extends the page as we scroll, which pushes the exit
    // condition further away every iteration. On a site that keeps appending
    // content that loop effectively never ends. MAX_SCROLL_STEPS caps it.
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

    // Measured before the screenshot so the capture can be clipped to a sane
    // height. The results page treats the loaded image's natural size as the
    // real source of truth anyway, so a clipped capture stays aligned.
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));

    // A screenshot is the nicest part of the result but it is not the result.
    // axe findings, the summary and the score are all still worth returning if
    // the capture is slow or fails, so this degrades to no screenshot rather
    // than throwing away an otherwise complete scan.
    let screenshot: string | null = null;
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
      screenshot = screenshotdata.toString("base64");
      console.log(
        `Captured in ${Date.now() - captureStarted}ms, ${Math.round(
          screenshot.length / 1024,
        )}kb base64`,
      );
    } catch (err) {
      console.error(
        `Screenshot failed after ${Date.now() - captureStarted}ms, continuing without one:`,
        err,
      );
    }
    // new AxeBuilder({ page }) is a function that runs the axe-core accessibility scanner on the page.
    // The "analyze()" function runs the scan and returns the results.
    const results = await new AxeBuilder({ page }).analyze();
    const findings = [];
    let number = 1;
    for (const violation of results.violations) {
      // Keep the selector and the element's own HTML together and filtered as
      // one, so the two arrays stay index-aligned. axe already captured the
      // html; the fix prompt uses it so an AI sees real markup, not a guess.
      const nodeData = violation.nodes
        .map((n) => ({ selector: n.target[0], html: n.html }))
        .filter(
          (n): n is { selector: string; html: string } =>
            typeof n.selector === "string",
        );
      const selectors = nodeData.map((n) => n.selector);
      // Strip data-* attributes from the captured markup. On Elementor/WordPress
      // pages these hold huge data-settings JSON blobs and framework ids that
      // are never relevant to accessibility and dominate the token cost of the
      // fix prompt. Class names are left alone: any one of them might be the
      // meaningful hook, so trimming those would be lossy. Children stay, since
      // outerHTML already includes them and they are often what explains a fix.
      const html = nodeData.map((n) =>
        n.html.replace(/\s+data-[\w-]+="[^"]*"/g, ""),
      );

      const boxes = await page.evaluate((sels) => {
        return sels.map((sel) => {
          let el;
          try {
            el = document.querySelector(sel);
          } catch {
            return null;
          }
          if (!el) return null;

          // An element can have real dimensions and still be invisible: hidden
          // video containers, opacity-0 wrappers, offscreen menus. Highlighting
          // those points the visitor at blank space. Dropping the box makes the
          // finding page-level instead, which is what it actually is.
          const cs = window.getComputedStyle(el);
          if (
            cs.display === "none" ||
            cs.visibility === "hidden" ||
            parseFloat(cs.opacity) === 0
          ) {
            return null;
          }

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
        // axe appends "?application=playwright" for its own analytics. That
        // leaks how Radar runs into a link handed to a visitor or pasted into
        // a brief, and the page is identical without it.
        helpUrl: violation.helpUrl.split("?")[0],
        selectors,
        html,
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
                    "Explain this website accessibility scan to someone with no technical background, like a small business owner. Write at a grade-7 reading level, in plain warm prose, two to four short sentences. No bullet points, no bold, no headers, no markdown. Never ask for more information or describe what you would do, you already have everything you need, always produce the actual summary. If issues are few or minor, say so plainly rather than sounding alarming. If there are many or serious issues, be honest and direct without being harsh. Group similar problems together in everyday language, never terms like 'ARIA', 'contrast ratio', or 'DOM'. For each group, say who it affects (for example, people using screen readers) and why it matters to them in concrete terms. Do not explain how to fix anything. Do not use em dashes. Never say 'audit' or 'certified'. Keep the whole summary under 150 words.",
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
    // The abort listener has done its job (or never fired); drop it so it can't
    // outlive the request.
    request.signal.removeEventListener("abort", onAbort);
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
