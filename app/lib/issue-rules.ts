// Everything Radar knows about axe rules lives here, away from the UI:
// severity colors and ranking, which rules affect the whole page, who
// typically fixes what, and plain-language rewrites of axe's descriptions.
// Issues.tsx stays purely about layout; this file is purely about content.

import type { Finding } from "@/app/types";

// Full class strings per severity, written out so Tailwind's scanner sees
// them. Text colors meet WCAG AA contrast, since Radar has to pass its own
// bar. `rank` controls sort order: critical first.
const IMPACTS: Record<
  string,
  { rank: number; chip: string; border: string; badge: string; fill: string }
> = {
  critical: {
    rank: 0,
    chip: "bg-red-100 text-red-900",
    border: "border-red-500",
    badge: "bg-red-600",
    fill: "bg-red-500/10",
  },
  serious: {
    rank: 1,
    chip: "bg-orange-100 text-orange-900",
    border: "border-orange-500",
    badge: "bg-orange-600",
    fill: "bg-orange-500/10",
  },
  moderate: {
    rank: 2,
    chip: "bg-amber-100 text-amber-900",
    border: "border-amber-500",
    badge: "bg-amber-600",
    fill: "bg-amber-500/10",
  },
  minor: {
    rank: 3,
    chip: "bg-gray-200 text-gray-800",
    border: "border-gray-400",
    badge: "bg-gray-500",
    fill: "bg-gray-400/10",
  },
};

// Rules a designer would fix (color, spacing, zoom); everything else is dev work.
const DESIGNER_RULES = new Set<string>([
  "color-contrast",
  "color-contrast-enhanced",
  "link-in-text-block",
  "meta-viewport",
  "meta-viewport-large",
]);

// Rules about the page as a whole, so there is no single spot to highlight.
const PAGE_LEVEL_RULES = new Set<string>([
  "html-has-lang",
  "html-lang-valid",
  "html-xml-lang-mismatch",
  "document-title",
  "meta-viewport",
  "meta-viewport-large",
  "meta-refresh",
  "page-has-heading-one",
  "landmark-one-main",
  "landmark-unique",
  "region",
  "bypass",
]);

// Plain-language explanations keyed by axe rule id. This is what a card
// leads with; the raw axe wording moves into "Technical details". Anything
// not listed falls back to axe's own description. Add rules as you meet them.
const PLAIN_TEXT: Record<string, string> = {
  "image-alt":
    "This image has no text describing it, so people using a screen reader have no idea what it shows.",
  "input-image-alt":
    "This image button has no text describing it, so screen reader users can't tell what it does.",
  label:
    "This form field has no label, so people using a screen reader can't tell what to type into it.",
  "select-name":
    "This dropdown has no name, so people using a screen reader can't tell what it's for.",
  "button-name":
    "This button has no readable text, so people using a screen reader don't know what it does.",
  "link-name":
    "This link has no readable text, so people using a screen reader don't know where it leads.",
  "aria-command-name":
    "This control has no readable name, so people using a screen reader don't know what it does.",
  "color-contrast":
    "The text here is too light against its background, so it's hard to read for people with low vision.",
  "color-contrast-enhanced":
    "The text here doesn't have enough contrast with its background for the highest readability standard.",
  list: "This list isn't built correctly, which can confuse screen readers as they read it out.",
  listitem:
    "A list item sits outside a proper list, which can confuse screen readers.",
  tabindex:
    "This element jumps ahead in the keyboard order, which makes navigating by keyboard confusing.",
  "heading-order":
    "The headings skip levels, which makes the page's structure harder to follow with a screen reader.",
  "document-title":
    "This page has no title, so people can't tell what it is from their browser tab or history.",
  "html-has-lang":
    "The page doesn't say what language it's in, so screen readers may read it with the wrong pronunciation.",
  "html-lang-valid":
    "The page's language setting isn't valid, so screen readers may read it with the wrong pronunciation.",
  "landmark-one-main":
    "The page has no main region marked, so screen reader users can't jump straight to the main content.",
  "landmark-unique":
    "Two regions share the same role and name, which makes it confusing to navigate between them.",
  region:
    "Some content isn't inside a labelled region, which makes the page harder to navigate section by section.",
  bypass:
    "There's no skip link, so keyboard users have to tab through everything to reach the main content.",
  "meta-viewport":
    "The page stops people from zooming in, so anyone who needs to enlarge the text can't.",
};

// Short scannable card titles, keyed by axe rule id. Cards lead with one of
// these and keep the grade-3 sentence below it.
//
// Two rules govern this table (EXPERIENCE.md D1 and D2):
//   1. Problem-shaped, never fix-shaped. Radar says what is wrong and where,
//      not what to do about it (FR6). A fix-shaped title also claims knowledge
//      the scan does not have: "increase the contrast" to what value?
//   2. No specification vocabulary. "Region", "landmark", "ARIA", "DOM",
//      "ratio" and "element" are banned here. They are fine inside Technical
//      details, which is the developer surface.
const TITLES: Record<string, string> = {
  "image-alt": "Image missing a description",
  "input-image-alt": "Image button missing a description",
  label: "Form field has no label",
  "select-name": "Dropdown has no name",
  "button-name": "Button has no readable text",
  "link-name": "Link has no readable text",
  "aria-command-name": "Control has no readable name",
  "color-contrast": "Text is hard to read against its background",
  "color-contrast-enhanced": "Text contrast could be stronger",
  list: "A list isn't built correctly",
  listitem: "A list item is in the wrong place",
  tabindex: "Jumps ahead in the keyboard order",
  "heading-order": "Headings skip levels",
  "document-title": "Page has no title",
  "html-has-lang": "Page doesn't say its language",
  "html-lang-valid": "Page's language setting isn't valid",
  "landmark-one-main": "The main content isn't marked",
  "landmark-unique": "Two sections share the same name",
  region: "Some content isn't in a labelled section",
  bypass: "No skip link to the main content",
  "meta-viewport": "Page blocks zooming",
};

// --- Helpers the UI actually calls ---

export const impactStyle = (impact: string) => IMPACTS[impact] ?? IMPACTS.minor;

export const bySeverity = (a: Finding, b: Finding) =>
  impactStyle(a.impact).rank - impactStyle(b.impact).rank;

export const whoFixes = (id: string) =>
  DESIGNER_RULES.has(id) ? "Designer" : "Frontend Dev";

// Shared so the sentence explaining these tags can render the exact same chip
// the cards use. A description of a thing should show the thing, otherwise the
// reader has to hold "Frontend Dev" in their head and go match it by eye.
// Size is deliberately left out: cards set it small, running text inherits.
export const WHO_FIXES_CHIP =
  "rounded-full bg-gray-200 px-2 py-0.5 font-medium text-gray-800";

export const isPageLevel = (finding: Finding) =>
  PAGE_LEVEL_RULES.has(finding.id) || finding.boxes.length === 0;

// Falling back to finding.description here would print axe's own developer
// wording ("Ensure role attribute has an appropriate value for the element")
// into a card that otherwise speaks plain English. Radar saying it doesn't
// have a translation yet is more honest and more useful than Radar repeating
// jargon as though it were an explanation. The rule name and selector are
// still in Technical details, so nothing is lost for whoever fixes it.
export const plainText = (finding: Finding) =>
  PLAIN_TEXT[finding.id] ??
  "This one is technical and we don't have a plain-English explanation for it yet. The details below will make sense to a developer.";

// Deliberately returns null rather than falling back to axe's `help` string.
// "Elements must have sufficient color contrast" is machine-voiced developer
// copy, and dropping it into a card that otherwise speaks plain English breaks
// the voice exactly where the visitor is already confused. A card with no
// title reads as quieter. A card with a machine-voiced title reads as broken.
export const cardTitle = (finding: Finding): string | null =>
  TITLES[finding.id] ?? null;

// An actual prompt, not a data dump. It opens by telling the AI what it is and
// what to do, puts the findings in the middle as reference, and closes with
// what a good answer looks like. That framing is the difference between the
// model treating this as a task and treating it as text to acknowledge.
//
// Radar still never states a fix itself; the prompt asks the AI for one and
// bounds how it should behave (grouping, brand colours, honesty). Uses axe's
// technical wording rather than the grade-3 card sentence, since the reader is
// a model or a developer. Static template, no model call, every field in hand.
export const buildBrief = (url: string | null, findings: Finding[]) => {
  const site = url ?? "this page";
  const n = findings.length;
  const issueWord = n === 1 ? "issue" : "issues";

  const lines = [
    `Radar scanned ${site} and found the accessibility ${issueWord} below. Help me fix them one by one.`,
    "",
    "For each issue:",
    "- Explain in plain terms what is wrong and who it affects.",
    "- Tell me where the fix belongs: HTML, a React component, a WordPress or Elementor template, CSS, or JavaScript. The affected element's markup is included to help you tell.",
    "- Provide a complete fix. Where code is needed, give me copy-and-paste code, not a snippet I have to assemble. Where the fix is a CMS setting (for example an Elementor widget option or a WordPress template tag), tell me exactly where to change it.",
    "- Rate the difficulty: Easy, Medium, or Hard.",
    "",
    "Group issues that share a root cause and fix them together. If a single change resolves several issues (adding one proper <main> landmark often clears multiple landmark issues at once, for example), recommend that rather than fixing each separately. Start with the most severe.",
    "",
    "Rules:",
    "- Do not guess at colour values for a contrast issue. You cannot know the brand palette, so tell me which elements need attention and ask me for the colours.",
    "- If the scan doesn't give you enough to be sure, say what extra markup or code you'd need rather than guessing.",
    "- If you make an assumption because the scan lacks context, label it clearly as an assumption.",
    "- After each issue, mention one or two related problems that commonly occur alongside it, but make clear those were NOT confirmed by this scan. It was automated and cannot catch everything.",
    "",
    "---",
    "",
    `## The ${n} ${issueWord}`,
    "",
  ];

  findings.forEach((finding, i) => {
    lines.push(`### ${i + 1}. ${cardTitle(finding) ?? finding.help}`);
    lines.push(
      `- Severity: ${finding.impact}`,
      `- Rule: ${finding.help} (${finding.id})`,
      `- Reference: ${finding.helpUrl}`,
    );

    const selectors = finding.selectors ?? [];
    const html = finding.html ?? [];
    if (selectors.length) {
      const label =
        selectors.length === 1
          ? "Affected element:"
          : `Affected elements (${selectors.length}):`;
      lines.push(label);
      selectors.forEach((selector, j) => {
        lines.push(`- \`${selector}\``);
        // The element's own markup, when the scan captured it. This is the
        // single biggest lever on fix quality: the AI reads the real element
        // instead of imagining it from a selector.
        if (html[j]) lines.push("  ```html", `  ${html[j]}`, "  ```");
      });
    }
    lines.push("");
  });

  return lines.join("\n").trimEnd();
};
