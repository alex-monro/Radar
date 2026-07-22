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

// --- Helpers the UI actually calls ---

export const impactStyle = (impact: string) =>
  IMPACTS[impact] ?? IMPACTS.minor;

export const bySeverity = (a: Finding, b: Finding) =>
  impactStyle(a.impact).rank - impactStyle(b.impact).rank;

export const whoFixes = (id: string) =>
  DESIGNER_RULES.has(id) ? "Designer" : "Frontend Dev";

export const isPageLevel = (finding: Finding) =>
  PAGE_LEVEL_RULES.has(finding.id) || finding.boxes.length === 0;

export const plainText = (finding: Finding) =>
  PLAIN_TEXT[finding.id] ?? finding.description;
