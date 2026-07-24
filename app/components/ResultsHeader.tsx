import ScoreGauge from "@/app/components/ScoreGauge";

type Props = {
  url: string | null;
  summary: string | null;
  score: number | null;
  // Zero issues found. The disclaimer gets heavier here rather than lighter:
  // a clean result is the moment someone is most likely to walk away believing
  // they are done, so it is the moment the honest wording matters most.
  clean?: boolean;
};

// Deliberately states no percentage. Published coverage figures describe the
// study that produced them, not this scan, which reads one page at one
// viewport with one engine. Quoting someone else's number here would imply a
// guarantee Radar cannot make. The concrete can/can't pairs below carry the
// same meaning without borrowing anyone's credibility.
const ResultsHeader = ({ url, summary, score, clean = false }: Props) => {
  return (
    <>
      {/* Mobile-first: a single centred column (title, then score, then the
          overview) with the score sitting right under the heading where it
          reads as the headline number. A CSS grid restores the desktop layout
          at lg: text on the left across two rows, score on the right spanning
          both and centred. The grid is what lets the score sit between title
          and overview in source order for mobile while still living in its own
          column on desktop. */}
      <section className="grid grid-cols-1 items-center gap-8 border-b border-gray-200 pb-12 pt-12 text-center lg:grid-cols-[1fr_auto] lg:gap-12 lg:pt-24 lg:text-left">
        <div className="flex flex-col gap-2 lg:col-start-1 lg:row-start-1">
          <h1 className="text-4xl font-semibold lg:text-5xl">Scan Results</h1>
          <a
            href={url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-lg text-muted transition-colors hover:text-black"
          >
            {url}
          </a>
        </div>

        {/* Score. In source order it sits here, between the title and the
            overview, so on mobile it stacks directly under the heading. On
            desktop the grid moves it to the right column, spanning both rows. */}
        <div className="flex shrink-0 flex-col items-center gap-2 lg:col-start-2 lg:row-span-2">
          <span className="text-2xl font-bold">Radar Score</span>
          <ScoreGauge score={score ?? 0} />
        </div>

        <div className="flex flex-col gap-8 text-left lg:col-start-1 lg:row-start-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">AI Overview</h2>
            {/* The link closes the summary rather than sitting in the
                disclaimer below: an action inside the honesty paragraph reads
                as a pitch and makes that paragraph less trustworthy, which is
                the one thing it cannot afford. Hidden on a clean scan, since
                there is nothing to fix. Plain anchor, not next/link, because a
                same-page jump also moves focus to the target for free. */}
            <p className="max-w-2xl">
              {summary}{" "}
              {!clean ? (
                <a href="#fix-with-ai" className="underline underline-offset-4">
                  Fix it with AI
                </a>
              ) : null}
            </p>
          </div>

          {clean ? (
            <div className="flex max-w-2xl flex-col gap-3 border-l-2 border-gray-300 pl-4">
              <p>
                Radar didn&apos;t find anything it knows how to check for.
                That&apos;s genuinely good news, and it isn&apos;t the same
                thing as your site being accessible.
              </p>
              <p>
                No automated scan catches everything. This one can tell you an
                image has no description. It can&apos;t tell you whether that
                description is any good. It can&apos;t tell you whether your
                page makes sense read aloud from top to bottom, or whether
                someone could finish a purchase using only a keyboard. Those
                need a person.
              </p>
              <p>
                A clean scan means the obvious problems are handled. That&apos;s
                a real achievement, and a starting point rather than a finish
                line.
              </p>
              <a
                href="https://www.w3.org/WAI/test-evaluate/tools/selecting/"
                target="_blank"
                rel="noopener noreferrer"
                className="self-start underline underline-offset-4"
              >
                Read what the W3C says about automated tools
              </a>
            </div>
          ) : (
            /* Same left-border treatment as the clean state so both read as an
               aside rather than a second paragraph of the summary. The border
               carries that meaning structurally, not by going grey and small,
               which would bury the one message that most needs reading. */
            <p className="max-w-2xl border-l-2 border-gray-300 pl-4">
              This is Radar&apos;s own automated check. It won&apos;t fix your
              site, make it legally compliant, or replace the human review every
              site needs. No automated scan catches everything, so think of it
              as a starting point.{" "}
              {/* The W3C, who write WCAG, state this plainly: tools "can not
                  determine accessibility, they can only assist in doing so".
                  Citing them beats asserting it ourselves. */}
              <a
                href="https://www.w3.org/WAI/test-evaluate/tools/selecting/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                Read what the W3C says about automated tools
              </a>
            </p>
          )}
        </div>
      </section>
    </>
  );
};

export default ResultsHeader;
