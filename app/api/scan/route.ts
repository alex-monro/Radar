import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ipAddress } from "@vercel/functions";

import { calculateScore } from "@/app/api/scan/lib/calculate-score";
import { getPageSpeedAccessibilityScore } from "@/app/api/scan/lib/pagespeed-score";
import {
  connectBrowser,
  createSession,
  isRetryable,
  stopSession,
} from "@/app/api/scan/lib/session";
import { openUrl, scrollAndMeasure } from "@/app/api/scan/lib/prepare-page";
import { captureScreenshot } from "@/app/api/scan/lib/capture-screenshot";
import { buildFindings, runAxe } from "@/app/api/scan/lib/findings";
import { summarize } from "@/app/api/scan/lib/summarize";

import { z } from "zod";

const requestSchema = z.object({
  url: z.httpUrl(),
});

// 50/day per IP. Generous while traffic is low; the one-session limit is the real cost guard.
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "24 h"),
  prefix: "ratelimit:scan",
});

// A full scan can run past Vercel's default 60s limit.
export const maxDuration = 300;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const parseResult = requestSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json(
      { error: "Invalid request body. Must include a valid URL." },
      { status: 400 },
    );
  }
  const { url } = parseResult.data;

  // Session first: a "busy" rejection must not spend a rate-limit count or a PageSpeed call.
  let session;
  try {
    session = await createSession();
  } catch (err) {
    console.error("Could not start a browser session:", err);
    if (isRetryable(err)) {
      return Response.json(
        {
          error:
            "The scanner is busy right now. Please wait a few seconds and try again.",
        },
        { status: 503 },
      );
    }
    return Response.json(
      { error: "The scanner is unavailable right now. Please try again later." },
      { status: 500 },
    );
  }

  // One stop per session, shared by the abort listener and the finally. The
  // finally awaits the same promise, so an abort's stop error still gets logged.
  let stopping: Promise<unknown> | undefined;
  const stop = () => (stopping ??= stopSession(session.id));

  // Free the one session slot as soon as the visitor leaves mid-scan.
  const onAbort = () => {
    stop().catch(() => {});
  };

  let browser;

  // Everything after the session lives inside this try, so the finally always releases it.
  try {
    const ip = ipAddress(request) ?? "unknown";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return Response.json(
        { error: "You've hit the daily scan limit. Try again later." },
        { status: 429 },
      );
    }

    // Started now, awaited at the end. Resolves to null on failure, never throws.
    const scorePromise = getPageSpeedAccessibilityScore(url);

    request.signal.addEventListener("abort", onAbort);

    const connection = await connectBrowser(session.wsEndpoint);
    browser = connection.browser;
    const page = connection.page;

    if (!(await openUrl(page, url))) {
      return Response.json(
        {
          error:
            "This site doesn't allow automated scans, so Radar couldn't check it. Orbit, our free Chrome extension, runs right in your own browser and can check pages like this one.",
        },
        { status: 502 },
      );
    }

    const dimensions = await scrollAndMeasure(page);
    const screenshot = await captureScreenshot(page, url, dimensions);
    const results = await runAxe(page);
    const findings = await buildFindings(page, results);
    const summary = await summarize(url, results);
    const score = (await scorePromise) ?? calculateScore(results);

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
    request.signal.removeEventListener("abort", onAbort);
    // Guarded separately so a failed close never skips stopping the session.
    try {
      if (browser) await browser.close();
    } catch (e) {
      console.error("browser.close() failed:", e);
    }
    try {
      await stop();
    } catch (e) {
      console.error("session stop failed:", e);
    }
  }
}
