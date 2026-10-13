import type { Page } from "playwright-core";
import type { AxeResults } from "axe-core";
import { AxeBuilder } from "@axe-core/playwright";

export const runAxe = (page: Page) => new AxeBuilder({ page }).analyze();

// Turns axe violations into numbered findings, each with the highlight boxes
// for its elements as they sit on the scrolled, measured page.
export const buildFindings = async (page: Page, results: AxeResults) => {
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
  return findings;
};
