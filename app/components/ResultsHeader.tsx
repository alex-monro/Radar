import ScoreGauge from "@/app/components/ScoreGauge";

type Props = {
  url: string | null;
  summary: string | null;
  score: number | null;
};

const ResultsHeader = ({ url, summary, score }: Props) => {
  return (
    <>
      <section className="flex flex-row items-center py-32 gap-12 justify-between flex-1 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-semibold">Scan Results</h1>
          <a
            href={url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-muted"
          >
            {url}
          </a>
          <h2 className="text-xl font-bold">OverView</h2>
          <p className="max-w-2xl">{summary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2 px-26">
          <span className="text-2xl font-bold">Radar Score</span>
          <ScoreGauge score={score ?? 0} />
        </div>
      </section>
    </>
  );
};

export default ResultsHeader;
