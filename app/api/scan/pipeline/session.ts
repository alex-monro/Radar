import { chromium } from "playwright-core";
import { Hyperbrowser, HyperbrowserError } from "@hyperbrowser/sdk";

const hb = new Hyperbrowser({
  apiKey: process.env.HYPERBROWSER_API_KEY,
});

// The free Hyperbrowser plan allows only ONE concurrent session, so this
// throws when another scan is already running. The caller turns that into a
// "busy" response. There is no session to clean up if this call itself fails.
export const createSession = () => hb.sessions.create({ useStealth: true });

// The SDK marks 429/502/503/504 and dropped connections as retryable
// (services/base.js). Anything else, like a bad key, will not fix itself.
export const isRetryable = (err: unknown) =>
  err instanceof HyperbrowserError && err.retryable;

export const stopSession = (id: string) => hb.sessions.stop(id);

// connectOverCDP connects Playwright to the remote browser over CDP.
// Hyperbrowser already gives the session a context and page, so use the
// existing context rather than browser.newContext() (which isn't the right
// pattern over a CDP connection).
//
// Returns the browser along with the page so the caller can close it. If
// opening the page fails after the connection succeeds, the browser is closed
// here, since the caller never received it.
export const connectBrowser = async (wsEndpoint: string) => {
  const browser = await chromium.connectOverCDP(wsEndpoint);
  try {
    const context = browser.contexts()[0];
    const page = await context.newPage();
    return { browser, page };
  } catch (err) {
    await browser.close().catch(() => {});
    throw err;
  }
};
