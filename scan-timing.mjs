// Standalone diagnostic for Radar's scan pipeline.
// Run from the radar/ folder so it can find node_modules:
//   node scan-timing.mjs https://your-site.com
// Mirrors the route's PARALLEL logic: PageSpeed starts first and runs in the
// background while the browser scan happens, then is awaited at the end.

import fs from "node:fs";
import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";
import OpenAI from "openai";
import { AxeBuilder } from "@axe-core/playwright";

// --- load .env.local into process.env (tolerates Windows CRLF + quotes) ---
try {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const l = line.replace(/\r$/, "").trim();
    if (!l || l.startsWith("#")) continue;
    const i = l.indexOf("=");
    if (i === -1) continue;
    process.env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("Could not read .env.local. Run this from inside the radar/ folder.");
  process.exit(1);
}

const url = process.argv[2] || "https://example.com";
const timings = {};
const time = async (label, fn) => {
  const s = Date.now();
  try { return await fn(); }
  finally { timings[label] = Date.now() - s; }
};

console.log(`\nScanning: ${url}\n`);

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
let browser;
const overall = Date.now();

// --- PageSpeed kicked off FIRST, not awaited (same as the route) ---
let psScore = null, psStatus = "skipped (no key)";
const psStart = Date.now();
const scorePromise = (async () => {
  if (!process.env.PAGESPEED_API_KEY) return null;
  const params = new URLSearchParams({
    url, key: process.env.PAGESPEED_API_KEY, category: "accessibility", strategy: "desktop",
  });
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
    if (!res.ok) { psStatus = `HTTP ${res.status} -> null (FELL BACK to local calc)`; return null; }
    const data = await res.json();
    const score = data?.lighthouseResult?.categories?.accessibility?.score;
    if (typeof score === "number") { psScore = Math.round(score * 100); psStatus = `OK, score=${psScore}`; return psScore; }
    psStatus = "no score in response -> null (FELL BACK to local calc)";
    return null;
  } catch (e) { psStatus = `threw: ${e.message} -> null (FELL BACK to local calc)`; return null; }
})();

try {
  const session = await time("1. browserbase session create", () => bb.sessions.create());
  browser = await time("2. connectOverCDP", () => chromium.connectOverCDP(session.connectUrl));
  const page = await time("3. newContext + newPage", async () => {
    const ctx = await browser.newContext();
    return ctx.newPage();
  });
  await time("4. page.goto", () => page.goto(url, { timeout: 30000 }));
  await time("5. waitForTimeout(3000)", () => page.waitForTimeout(3000));
  await time("6. screenshot (fullPage)", () => page.screenshot({ fullPage: true }));
  const results = await time("7. axe analyze", () => new AxeBuilder({ page }).analyze());

  // --- OpenAI summary (only when there are violations, same as the route) ---
  let aiStatus;
  const violationCount = results.violations.length;
  if (violationCount === 0) {
    aiStatus = "skipped (0 violations, hardcoded message)";
  } else {
    const issues = results.violations
      .map(v => `Impact: ${v.impact} Desc: ${v.description} Elements: ${v.nodes.length}`)
      .join("\n");
    await time("8. OpenAI summary", async () => {
      const client = new OpenAI();
      const r = await client.responses.create({
        model: "gpt-5.6",
        input: [
          { role: "developer", content: "Summarize this accessibility scan in two to four plain sentences, grade-3 reading level, no jargon, under 150 words, no em dashes." },
          { role: "user", content: `Issues on ${url}:\n\n${issues}` },
        ],
      });
      aiStatus = `OK, ${r.output_text.length} chars`;
    });
  }

  // --- now await PageSpeed: this is the leftover wait after everything else ---
  const waitStart = Date.now();
  const finalScore = await scorePromise;
  const leftoverWait = Date.now() - waitStart;
  const psTotal = Date.now() - psStart;

  const total = Date.now() - overall;

  console.log("PER-STAGE TIMING (sequential browser work)");
  for (const [k, v] of Object.entries(timings)) {
    console.log(`  ${k.padEnd(30)} ${(v / 1000).toFixed(2)}s`);
  }
  console.log("\nPAGESPEED (ran in parallel with the above)");
  console.log(`  full PageSpeed duration:   ${(psTotal / 1000).toFixed(2)}s`);
  console.log(`  leftover wait at the end:  ${(leftoverWait / 1000).toFixed(2)}s  <- what parallel actually costs you`);
  console.log("\nRESULTS");
  console.log(`  violations found:  ${violationCount}`);
  console.log(`  PageSpeed:         ${psStatus}`);
  console.log(`  score used:        ${finalScore ?? "(fell back to local calc)"}`);
  console.log(`  AI summary:        ${aiStatus}`);
  console.log(`\n  TOTAL wall time:   ${(total / 1000).toFixed(2)}s\n`);
} catch (e) {
  console.error("\nPipeline threw:", e);
} finally {
  if (browser) await browser.close();
}
