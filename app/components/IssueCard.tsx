import type { Finding } from "@/app/types";
import { impactStyle, plainText, whoFixes } from "./issueRules";

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
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-800">
          {whoFixes(finding.id)}
        </span>
        {places > 1 ? (
          <span className="text-sm text-gray-600">{places} places</span>
        ) : null}
      </div>
      <p className="leading-relaxed">{plainText(finding)}</p>
    </>
  );

  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border p-4 transition-colors ${
        selected ? "border-gray-900 bg-gray-50" : "border-gray-200"
      }`}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="flex w-full flex-col gap-2 text-left"
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
            {finding.selectors?.length ? (
              <ul className="flex flex-col gap-1">
                {finding.selectors.map((sel) => (
                  <li key={sel}>
                    <code className="break-all text-xs">{sel}</code>
                  </li>
                ))}
              </ul>
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
