"use client";

import { useRef, useState } from "react";
import { AxeResults } from "axe-core";
import type { Finding, PageDimensions } from "@/app/types";
import IssueCard from "./IssueCard";
import { bySeverity, impactStyle, isPageLevel } from "./issueRules";

type Props = {
  results: AxeResults | null;
  screenshot: string | null;
  findings: Finding[];
  dimensions: PageDimensions | null;
};

const Issues = ({ results, screenshot, findings, dimensions }: Props) => {
  const ordered = [...findings].sort(bySeverity);
  const elementFindings = ordered.filter((f) => !isPageLevel(f));
  const pageFindings = ordered.filter(isPageLevel);
  const count = ordered.length || (results?.violations.length ?? 0);

  const [selected, setSelected] = useState<number | null>(null);
  // The page height the screenshot actually shows, in page pixels. Usually
  // this matches dimensions.height, but on pages that keep loading content
  // the two can drift apart. Trusting the real image keeps every highlight
  // box inside it instead of spilling past the bottom.
  const [shownHeight, setShownHeight] = useState<number | null>(null);
  // Refs to the first highlight box of each element finding, so a card click
  // can scroll the window to it.
  const boxRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleSelect = (i: number) => {
    setSelected(i);
    boxRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Converts page pixels into a percentage of the full page size, so the
  // highlight boxes scale with the screenshot at any width.
  const pct = (part: number, whole: number) => `${(part / whole) * 100}%`;

  // Height denominator for the boxes: prefer what the image really shows,
  // fall back to what the API reported.
  const pageHeight = shownHeight ?? dimensions?.height ?? null;

  return (
    <section className="flex flex-col gap-10 py-16">
      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-semibold">
          Issues <span className="text-3xl text-gray-600">({count})</span>
        </h2>

        <div className="flex flex-col items-start gap-8 lg:flex-row">
          {/* Full-page screenshot with numbered highlights. No inner scroll:
              the image renders at full height and the page scrolls. */}
          <div className="w-full shrink-0 lg:w-2/3">
            {/* overflow-hidden is a safety net: a box that somehow lands
                outside the image gets clipped instead of breaking the page. */}
            <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm">
              {screenshot ? (
                <img
                  src={`data:image/png;base64,${screenshot}`}
                  alt="Screenshot of the scanned page. Full issue detail is in the list."
                  className="block h-auto w-full rounded-lg"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (dimensions) {
                      // How many page pixels tall the screenshot really is:
                      // its natural aspect ratio times the page width.
                      setShownHeight(
                        (img.naturalHeight / img.naturalWidth) *
                          dimensions.width,
                      );
                    }
                  }}
                />
              ) : null}

              {dimensions && pageHeight
                ? elementFindings.flatMap((finding, i) =>
                    finding.boxes.map((box, j) => {
                      // This spot wasn't captured in the screenshot (the page
                      // grew after the capture), so there is nothing to mark.
                      // The issue still shows in the card list.
                      if (box.y >= pageHeight) return null;
                      const style = impactStyle(finding.impact);
                      return (
                        <div
                          key={`${i}-${j}`}
                          ref={
                            j === 0
                              ? (el) => {
                                  boxRefs.current[i] = el;
                                }
                              : undefined
                          }
                          aria-hidden="true"
                          className={`absolute rounded-sm border-2 transition-all ${style.border} ${style.fill} ${
                            selected === i
                              ? "z-10 scale-[1.02] ring-2 ring-gray-900"
                              : ""
                          }`}
                          style={{
                            left: pct(box.x, dimensions.width),
                            top: pct(box.y, pageHeight),
                            width: pct(box.width, dimensions.width),
                            height: pct(box.height, pageHeight),
                          }}
                        >
                          <span
                            className={`absolute -left-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${style.badge}`}
                          >
                            {i + 1}
                          </span>
                        </div>
                      );
                    }),
                  )
                : null}
            </div>
          </div>

          {/* Element-level issue cards, plain language first. */}
          <ul className="flex w-full flex-col gap-4 lg:w-1/3">
            {elementFindings.map((finding, i) => (
              <IssueCard
                key={`${finding.id}-${i}`}
                finding={finding}
                number={i + 1}
                selected={selected === i}
                onSelect={() => handleSelect(i)}
              />
            ))}
          </ul>
        </div>
      </div>

      {/* Page-level issues: whole-page problems, no screenshot highlight. */}
      {pageFindings.length > 0 ? (
        <div className="flex flex-col gap-4  pt-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-semibold">
              Page-level issues{" "}
              <span className="text-3xl text-gray-600">
                ({pageFindings.length})
              </span>
            </h2>
            <p>
              These affect the whole page rather than one spot, so they are not
              marked on the screenshot above.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pageFindings.map((finding, i) => (
              <IssueCard key={`${finding.id}-${i}`} finding={finding} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default Issues;
