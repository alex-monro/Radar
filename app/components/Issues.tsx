"use client";

import { useEffect, useRef, useState } from "react";
import { AxeResults } from "axe-core";
import type { Finding, PageDimensions } from "@/app/types";
import IssueCard from "./IssueCard";
import BriefButton from "./BriefButton";
import {
  buildBrief,
  bySeverity,
  impactStyle,
  isPageLevel,
} from "@/app/lib/issue-rules";

// Card count at which the layout switches from one flowing page to two
// scrolling panes. Tune by eye against real scans.
const COMPACT_THRESHOLD = 8;

// Orbit's live Chrome Web Store listing.
const ORBIT_URL =
  "https://chromewebstore.google.com/detail/orbit/nflfajnljpdmndndfeeaagljhgjailco";

type Props = {
  results: AxeResults | null;
  screenshot: string | null;
  findings: Finding[];
  dimensions: PageDimensions | null;
  url: string | null;
};

const Issues = ({ results, screenshot, findings, dimensions, url }: Props) => {
  const ordered = [...findings].sort(bySeverity);
  const elementFindings = ordered.filter((f) => !isPageLevel(f));
  const pageFindings = ordered.filter(isPageLevel);
  const count = ordered.length || (results?.violations.length ?? 0);

  const [selected, setSelected] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "one">("all");
  // The real height of the loaded image, which can drift from the height the
  // API reported if the page kept loading. Trusting the image keeps every
  // highlight inside it.
  const [shownHeight, setShownHeight] = useState<number | null>(null);
  const boxRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Derived from card count, never from measuring the rendered column: a
  // measurement would change the very size it measures and oscillate.
  const compact = elementFindings.length >= COMPACT_THRESHOLD;

  // Not scrollIntoView, which scrolls every scrollable ancestor and so moves
  // the page as well as the image. Reduced motion is honoured throughout.
  const scrollToBox = (findingIndex: number, boxIndex: number) => {
    const box = boxRefs.current[`${findingIndex}-${boxIndex}`];
    if (!box) return;

    const behavior: ScrollBehavior = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? "auto"
      : "smooth";

    const viewport = viewportRef.current;
    // Below lg there is no inner scroll container, so the page has to move.
    const scrollsInternally =
      !!viewport && viewport.scrollHeight > viewport.clientHeight;

    if (scrollsInternally) {
      // Clamped, because near the top or bottom the container cannot centre.
      const wanted =
        box.offsetTop - viewport.clientHeight / 2 + box.offsetHeight / 2;
      const maxScroll = viewport.scrollHeight - viewport.clientHeight;
      const target = Math.max(0, Math.min(wanted, maxScroll));
      viewport.scrollTo({ top: target, behavior });

      // The sticky nav covers the top of the viewport, so usable space starts
      // below it. Measured so it can't drift from the nav's real padding.
      const navHeight =
        document.querySelector("nav")?.getBoundingClientRect().height ?? 0;

      // Where the box lands on screen after the container scrolls.
      const viewportRect = viewport.getBoundingClientRect();
      const boxTop = viewportRect.top + (box.offsetTop - target);
      const boxBottom = boxTop + box.offsetHeight;

      const margin = 24;
      const needsPageScroll =
        boxTop < navHeight + margin || boxBottom > window.innerHeight - margin;

      if (needsPageScroll) {
        // Centre it in the usable viewport rather than nudging it just past
        // the edge. A minimum nudge technically satisfies "visible" and reads
        // as the page grudgingly moving as little as it can get away with.
        // If we are moving at all, land it somewhere comfortable.
        const usableHeight = window.innerHeight - navHeight;
        // Math.max stops a very tall box from having its top pushed under the
        // nav in the name of centring it.
        const desiredTop = Math.max(
          navHeight + margin,
          navHeight + usableHeight / 2 - box.offsetHeight / 2,
        );
        window.scrollBy({ top: boxTop - desiredTop, behavior });
      }
      return;
    }

    box.scrollIntoView({ behavior, block: "center" });
  };

  // Selecting only sets state. The scroll happens in the effect below, after
  // the render, because in "one at a time" mode the unselected boxes are
  // display:none: at click time the target still has offsetTop 0 and the
  // scroll goes nowhere. That was the "needs two clicks" bug, where the first
  // click only made the box visible.
  const handleSelect = (i: number) => setSelected(i);

  const [briefCopied, setBriefCopied] = useState(false);

  // The results layout genuinely differs by device, not just in sizing: on
  // desktop the screenshot is the hero in a two-column split; on a phone a
  // desktop-width capture scales to an unreadable thumbnail, so the cards lead
  // and the screenshot moves into a tap-to-open disclosure. Rendering one
  // branch or the other (rather than hiding one with CSS) keeps the large
  // base64 image in the DOM only once. Lazy init reads the real width on the
  // first client render, so there is no flash. 1024px matches the lg: the
  // desktop layout already uses.
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Built locally from a template, with no model call. This gets pasted into an
  // AI tool or read by a developer, and both of those do their own synthesis,
  // so summarising first would pay for work that happens again downstream. It
  // would also risk quietly dropping a finding, which a product about telling
  // you exactly what is wrong cannot afford. The template is complete by
  // construction, instant, free and identical every time.
  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(buildBrief(url, ordered));
      setBriefCopied(true);
      window.setTimeout(() => setBriefCopied(false), 3000);
    } catch {
      // Clipboard can be blocked by permissions or a non-secure context.
    }
  };

  useEffect(() => {
    if (selected === null) return;
    scrollToBox(selected, 0);
  }, [selected]);

  // Page pixels as a percentage, so highlights scale with the image.
  const pct = (part: number, whole: number) => `${(part / whole) * 100}%`;

  const pageHeight = shownHeight ?? dimensions?.height ?? null;

  // The image plus its positioned highlight boxes. Shared by both layouts: on
  // desktop it sits in the scrolling left column, on mobile inside the
  // disclosure. Rendered once, in whichever branch is active.
  const screenshotView = (
    <div className="relative">
      {!screenshot ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="font-medium">
            We couldn&apos;t capture a picture of this page.
          </p>
          <p className="max-w-md">
            It was too large or too slow to photograph. Everything else in this
            scan is real, the issues just aren&apos;t marked on an image.
          </p>
        </div>
      ) : null}
      {screenshot ? (
        <img
          // Must stay in step with the `type` passed to page.screenshot.
          src={`data:image/jpeg;base64,${screenshot}`}
          alt="Screenshot of the scanned page. Full issue detail is in the list."
          className="block h-auto w-full rounded-lg"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (dimensions) {
              setShownHeight(
                (img.naturalHeight / img.naturalWidth) * dimensions.width,
              );
            }
          }}
        />
      ) : null}

      {dimensions && pageHeight
        ? elementFindings.flatMap((finding, i) =>
            finding.boxes.map((box, j) => {
              // Below the captured image, so nothing to mark. Still a card.
              if (box.y >= pageHeight) return null;
              const style = impactStyle(finding.impact);
              const isSelected = selected === i;
              // Selection reads by suppressing the others, not boosting one.
              // Every spot of the selected issue stays full strength. D4.
              const dimming =
                viewMode === "one"
                  ? isSelected
                    ? ""
                    : "hidden"
                  : selected === null || isSelected
                    ? ""
                    : "opacity-15";
              return (
                <div
                  key={`${i}-${j}`}
                  ref={(el) => {
                    boxRefs.current[`${i}-${j}`] = el;
                  }}
                  aria-hidden="true"
                  className={`absolute rounded-sm border-2 transition-all ${style.border} ${style.fill} ${
                    isSelected ? "z-10" : ""
                  } ${dimming}`}
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
  );

  // The element-level issue cards. On mobile they are static and lead the
  // page; on desktop they are the interactive selectable column.
  const cardList = elementFindings.map((finding, i) =>
    isDesktop ? (
      <IssueCard
        key={`${finding.id}-${i}`}
        finding={finding}
        number={i + 1}
        selected={selected === i}
        onSelect={() => handleSelect(i)}
      />
    ) : (
      <IssueCard key={`${finding.id}-${i}`} finding={finding} number={i + 1} />
    ),
  );

  return (
    <div className="flex flex-col gap-12 pb-24">
      {/* Same rhythm as ResultsHeader: gap-2 inside a group, gap-8 between
          groups, so a heading sits tight against what it labels. */}
      <section
        aria-labelledby="issues-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="issues-heading" className="text-3xl font-semibold">
          Issues <span className="text-3xl text-gray-600">({count})</span>
        </h2>

        {isDesktop ? (
          <>
            {/* Belongs with the screenshot and cards it controls, directly above
            them. Real radio semantics so arrow keys work and the group is
            announced without extra ARIA. */}
            <div className="flex flex-col gap-2">
              <fieldset className="flex flex-wrap items-center gap-4">
                <legend className="sr-only">Highlight display</legend>
                <span aria-hidden="true" className="font-medium">
                  Show:
                </span>
                {(
                  [
                    ["all", "All issues"],
                    ["one", "One at a time"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="highlight-view-mode"
                      value={value}
                      checked={viewMode === value}
                      onChange={() => setViewMode(value)}
                      className="h-4 w-4 accent-gray-900"
                    />
                    {label}
                  </label>
                ))}
              </fieldset>

              {/* Polite live region. Silent in the resting state, so it only speaks
              when there is something worth saying. min-h reserves the space so
              the layout doesn't jump when it fills. */}
              <p role="status" className="min-h-6">
                {(() => {
                  const finding =
                    selected !== null ? elementFindings[selected] : null;
                  const spots =
                    finding?.selectors?.length ?? finding?.boxes.length ?? 0;

                  if (finding && spots > 1) {
                    return `Showing ${spots} spots for this issue. Scroll the screenshot to see them all.`;
                  }
                  if (viewMode === "one" && selected === null) {
                    return "Select an issue to mark it on the screenshot.";
                  }
                  return "";
                })()}
              </p>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-stretch">
              {/* min-h is the floor for a scan with very few cards, so the
              screenshot never becomes a letterbox. */}
              <div
                className={`w-full shrink-0 lg:relative lg:w-2/3 ${
                  compact ? "lg:h-[calc(100vh-8rem)]" : "lg:min-h-[40rem]"
                }`}
              >
                {/* absolute inset-0 keeps the image out of the height calculation.
                Otherwise items-stretch equalises to the TALLEST column and a
                20,000px image would set the row height instead of the cards.
                tabIndex + role=region make this scrollable area keyboard
                operable (axe's scrollable-region-focusable, which Orbit caught
                on Radar itself). An earlier attempt jumped the page on focus,
                but that was the old scrollIntoView-every-ancestor logic; the
                scroll code now targets this element precisely, so focus no
                longer yanks the page. */}
                <div
                  ref={viewportRef}
                  tabIndex={0}
                  role="region"
                  aria-label="Screenshot of the scanned page. Every issue is described in the list beside it."
                  className="thin-scroll overflow-hidden rounded-lg border border-gray-200 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 lg:absolute lg:inset-0 lg:overflow-y-auto lg:overscroll-contain"
                >
                  {/* The positioning context for the boxes. Must not be the
                  scrolling element, or they stay pinned to the scrollport. */}
                  <div className="relative">
                    {!screenshot ? (
                      <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-8 text-center">
                        <p className="font-medium">
                          We couldn&apos;t capture a picture of this page.
                        </p>
                        <p className="max-w-md">
                          It was too large or too slow to photograph. Everything
                          else in this scan is real, the issues just aren&apos;t
                          marked on an image.
                        </p>
                      </div>
                    ) : null}
                    {screenshot ? (
                      <img
                        // Must stay in step with the `type` passed to
                        // page.screenshot in the scan route.
                        src={`data:image/jpeg;base64,${screenshot}`}
                        alt="Screenshot of the scanned page. Full issue detail is in the list."
                        className="block h-auto w-full rounded-lg"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          if (dimensions) {
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
                            // Below the captured image, so nothing to mark. Still
                            // listed as a card.
                            if (box.y >= pageHeight) return null;
                            const style = impactStyle(finding.impact);
                            const isSelected = selected === i;
                            // Selection reads by suppressing the others, not by
                            // boosting one. Every spot of the selected issue stays
                            // full strength: the count is the point. See
                            // EXPERIENCE.md D4.
                            const dimming =
                              viewMode === "one"
                                ? isSelected
                                  ? ""
                                  : "hidden"
                                : selected === null || isSelected
                                  ? ""
                                  : "opacity-15";
                            return (
                              <div
                                key={`${i}-${j}`}
                                ref={(el) => {
                                  boxRefs.current[`${i}-${j}`] = el;
                                }}
                                aria-hidden="true"
                                className={`absolute rounded-sm border-2 transition-all ${style.border} ${style.fill} ${
                                  isSelected ? "z-10" : ""
                                } ${dimming}`}
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
              </div>

              {/* Element-level issue cards, plain language first. */}
              <ul
                className={`flex w-full flex-col gap-4 lg:w-1/3 ${
                  compact
                    ? "lg:h-[calc(100vh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2"
                    : ""
                }`}
              >
                {cardList}
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Mobile: cards lead; the screenshot moves into a tap-to-open
                disclosure, since a desktop-width capture is unreadable scaled
                to a phone. Cards are static here, carrying all the info. */}
            <details className="rounded-lg border border-gray-200">
              <summary className="cursor-pointer select-none px-4 py-3 font-medium">
                See your page with the issues marked
              </summary>
              <div className="border-t border-gray-200 p-2">
                {screenshotView}
              </div>
            </details>
            <ul className="flex flex-col gap-4">{cardList}</ul>
          </>
        )}
      </section>

      {/* Page-level issues: whole-page problems, no screenshot highlight. */}
      {pageFindings.length > 0 ? (
        <section
          aria-labelledby="page-level-issues-heading"
          className="flex flex-col pb-12"
        >
          <div className="flex flex-col gap-1">
            <h2
              id="page-level-issues-heading"
              className="text-3xl font-semibold"
            >
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

          {/* lg, not md: the whole results page switches layout at lg, so
              page-level cards stay single-column through tablet and only go
              two-up on desktop. Breaking at md left them two-column while the
              element cards were still stacked, and an odd count left an empty
              grid cell, which read as an unwanted gap. */}
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pageFindings.map((finding, i) => (
              <IssueCard key={`${finding.id}-${i}`} finding={finding} />
            ))}
          </ul>
        </section>
      ) : null}

      {/* Last on the page on purpose: read the findings, then act on them.
          A peer of the Issues and Page-level headings, so it takes an h2.
          The copy stops short of promising a fix and says "the rule it breaks"
          rather than naming WCAG, because what ships is an axe rule id.
          See EXPERIENCE.md D7 and FR6. */}
      {/* scroll-mt clears the sticky nav, which would otherwise cover the
          heading when the disclaimer's anchor link jumps here. */}
      <section
        id="fix-with-ai"
        aria-labelledby="fix-with-ai-heading"
        className="flex scroll-mt-28 flex-col gap-8 pt-16 border-t border-gray-200"
      >
        <div className="flex flex-col gap-8">
          <h2 id="fix-with-ai-heading" className="text-3xl font-semibold">
            Fix-ready prompt
          </h2>
          <p>
            Turn these results into a ready-to-paste prompt for Cursor, Claude,
            or any AI coding tool. Every issue, the rule it breaks, exactly
            where it is, and who it affects. Hand it to a developer or drop it
            straight into your editor.
          </p>
        </div>

        <div className="flex items-start">
          <BriefButton
            onClick={copyBrief}
            label={briefCopied ? "Copied!" : "Copy prompt"}
          />
        </div>
        {/* A changed button label isn't announced on its own, so the
            confirmation is spoken here and stays out of the layout. */}
        <span role="status" className="sr-only">
          {briefCopied ? "Brief copied to clipboard" : ""}
        </span>
      </section>

      {/* Orbit cross-link (FR10, Story 1.5). Same section rhythm as the
          Fix-ready prompt, but deliberately one notch quieter per UX-DR13's
          "low-key" rule: a text link, not the primary gradient button, and copy
          aimed at the developer who would actually use a build-time tool rather
          than the business owner reading the report. */}
      <section
        aria-labelledby="orbit-heading"
        className="flex flex-col gap-8 border-t border-gray-200 pt-16"
      >
        <div className="flex flex-col gap-8">
          <h2 id="orbit-heading" className="text-3xl font-semibold">
            Building sites yourself?
          </h2>
          <p>
            Orbit is Radar&apos;s sibling, a Chrome extension that catches
            accessibility issues while you code.
          </p>
        </div>

        <div className="flex items-start">
          <a
            href={ORBIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg underline underline-offset-4"
          >
            Get Orbit →
          </a>
        </div>
      </section>
    </div>
  );
};

export default Issues;
