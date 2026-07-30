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
// cards get a number, a selected state, and an onSelect click
const IssueCard = ({ finding, number, selected = false, onSelect }: Props) => {
  const style = impactStyle(finding.impact);
  const places = finding.selectors?.length ?? finding.boxes.length;
  // Null for any rule not in the title table, on purpose. See cardTitle.
  const title = cardTitle(finding);
  const [copied, setCopied] = useState(false);
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
        {/* A pin rather with a number to show how many places the issue occurs */}
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
      {/* Card Title*/}
      {title ? <h3 className="font-semibold leading-snug">{title}</h3> : null}
      <p className="leading-relaxed">{plainText(finding)}</p>
    </>
  );

  return (
    <li
      className={`relative flex shrink-0 flex-col gap-3 overflow-hidden rounded-lg border p-4 transition-colors has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-gray-900 has-[button:focus-visible]:ring-offset-2 ${
        onSelect ? "pl-5" : ""
      } ${
        selected
          ? "border-gray-900 bg-gray-50"
          : "border-gray-200 has-[button:hover]:border-gray-400 has-[button:hover]:bg-gray-50"
      }`}
    >
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
          aria-label={`Show issue ${number} on the screenshot: ${title ?? finding.help}`}
          aria-pressed={selected}
          className="flex w-full cursor-pointer flex-col gap-2 text-left focus-visible:outline-none"
        >
          {body}
        </button>
      ) : (
        body
      )}

      <div className="flex items-start justify-between gap-3">
        <details className="min-w-0 text-sm text-gray-600">
          <summary className="cursor-pointer select-none">
            Technical details
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <p className="text-gray-700">
              <span className="font-medium">Rule:</span> {finding.help} (
              <code className="text-xs">{finding.id}</code>)
            </p>

            {finding.selectors?.length ? (
              <div className="flex flex-col gap-2">
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
          aria-label={`Open documentation for ${title ?? finding.help} in a new tab`}
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
