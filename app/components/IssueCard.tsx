"use client";

import { useState } from "react";
import type { Finding } from "@/app/types";
import {
  cardTitle,
  impactStyle,
  plainText,
  whoFixes,
  WHO_FIXES_CHIP,
} from "@/app/lib/issue-rules";

type Props = {
  finding: Finding;
  number?: number;
  selected?: boolean;
  onSelect?: () => void;
};

// One issue card, used by both lists on the results page. Element-level
// cards get a number, a selected state, and an onSelect click; page-level
// cards render the same content without them.
const IssueCard = ({ finding, number, selected = false, onSelect }: Props) => {
  const style = impactStyle(finding.impact);
  const places = finding.selectors?.length ?? finding.boxes.length;
  // Null for any rule not in the title table, on purpose. See cardTitle.
  const title = cardTitle(finding);
  const [copied, setCopied] = useState(false);

  // The stepper serves the person exploring their own site one spot at a time.
  // Whoever they hand this to needs the whole list at once, which is a
  // different job, so it gets its own control rather than reusing the stepper.
  const copyAll = async () => {
    if (!finding.selectors?.length) return;
    try {
      await navigator.clipboard.writeText(
        `${finding.help} (${finding.id})\n\n${finding.selectors.join("\n")}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by permissions or a non-secure context.
      // The selectors are still readable above, so fail quietly.
    }
  };

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {number ? (
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${style.badge}`}
          >
            {number}
          </span>
        ) : null}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style.chip}`}
        >
          {finding.impact}
        </span>
        <span className={`text-xs ${WHO_FIXES_CHIP}`}>
          {whoFixes(finding.id)}
        </span>
        {/* A pin rather than a warning glyph. The concept here is "this happens
            in several locations", not "this is urgent": the severity chip owns
            urgency, and an alarm icon on a six-place minor issue would outshout
            a one-place critical. Outlined rather than filled so it reads as a
            property of the issue and not as a third severity signal. */}
        {places > 1 ? (
          <span className="flex items-center gap-1 rounded-full border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-800">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {places} places
          </span>
        ) : null}
      </div>
      {/* Title carries the scannable summary, the grade-3 sentence carries the
          meaning. Rules with no mapped title simply lead with the sentence. */}
      {title ? <h3 className="font-semibold leading-snug">{title}</h3> : null}
      <p className="leading-relaxed">{plainText(finding)}</p>
    </>
  );

  return (
    <li
      // The hover and focus styling lives on the card rather than the inner
      // button so the whole card reacts, not just the rectangle the button
      // happens to occupy. has-[] lets the parent respond to the child's state.
      // pl-5 only where an accent bar can actually appear. Page-level cards are
      // never selectable, so on those the extra left padding was dead space
      // that pushed their text out of line with every other card.
      // shrink-0 matters once the list has a bounded height. Flex items shrink
      // to fit by default, so without it the cards compress and clip their own
      // text instead of overflowing and letting the column scroll.
      className={`relative flex shrink-0 flex-col gap-3 overflow-hidden rounded-lg border p-4 transition-colors has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-gray-900 has-[button:focus-visible]:ring-offset-2 ${
        onSelect ? "pl-5" : ""
      } ${
        selected
          ? "border-gray-900 bg-gray-50"
          : "border-gray-200 has-[button:hover]:border-gray-400 has-[button:hover]:bg-gray-50"
      }`}
    >
      {/* Solid accent bar in the finding's severity colour. A border shift from
          gray-200 to gray-900 is not perceivable at a glance; this is, and it
          colour-matches the card to its highlight box on the screenshot. */}
      {selected ? (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 w-1.5 ${style.badge}`}
        />
      ) : null}
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          // The ring is drawn by the parent card, so suppress the default
          // outline here rather than having two focus indicators.
          className="flex w-full cursor-pointer flex-col gap-2 text-left focus-visible:outline-none"
        >
          {body}
        </button>
      ) : (
        body
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Collapsed-by-default raw rule name and CSS selector(s), kept quiet
            so it never competes with the plain-language explanation above. */}
        <details className="min-w-0 text-sm text-gray-600">
          <summary className="cursor-pointer select-none">
            Technical details
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <p className="text-gray-700">
              <span className="font-medium">Rule:</span> {finding.help} (
              <code className="text-xs">{finding.id}</code>)
            </p>
            {/* One selector at a time, never the whole list. A rule like
                color-contrast can fail forty times, and forty lines of
                ".col:nth-child(3) > ul > li:nth-child(5) > a" is a wall that
                helps nobody, including the developer it is written for.
                Stepping also moves the highlight on the screenshot. */}
            {finding.selectors?.length ? (
              <div className="flex flex-col gap-2">
                {/* No per-spot stepper. Every spot for this issue is already
                    highlighted on the screenshot at once, so walking them one
                    at a time added a control, an announcement and a scroll
                    target without showing anything the visitor could not
                    already see. Whoever fixes it wants the full list anyway,
                    which is what the copy button is for. */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyAll}
                    className="cursor-pointer self-start rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-50"
                  >
                    Copy all {finding.selectors.length}{" "}
                    {finding.selectors.length === 1 ? "spot" : "spots"}
                  </button>
                  {/* Polite, so the confirmation is announced rather than being
                      a purely visual state change that a screen reader misses. */}
                  <span aria-live="polite" className="text-xs text-muted">
                    {copied ? "Copied to clipboard" : ""}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </details>

        {/* Link out to the docs for this rule. */}
        <a
          href={finding.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the documentation for this issue in a new tab"
          title="Learn more"
          className="shrink-0 self-start text-gray-500 transition-colors hover:text-gray-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </li>
  );
};

export default IssueCard;
