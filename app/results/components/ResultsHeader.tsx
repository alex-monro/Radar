import type { ScanResult as Scan } from "../../api/scan/route";
import {
  SEVERITY_ORDER,
  SEVERITY_COLOR,
  countBySeverity,
  scoreColor,
} from "../lib/severity";

function ScoreRing({ score }: { score: number }) {
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
      <circle
        cx="66"
        cy="66"
        r={r}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="8"
      />
      <circle
        cx="66"
        cy="66"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 66 66)"
      />
    </svg>
  );
}

function SeverityCounts({ scan }: { scan: Scan }) {
  const counts = countBySeverity(scan.findings);
  const active = SEVERITY_ORDER.filter((s) => counts[s] > 0);

  if (active.length === 0) return null;

  return (
    <ul
      className="flex flex-col gap-3 list-none"
      aria-label="Issue counts by severity"
    >
      {active.map((s) => (
        <li key={s} className="flex items-baseline gap-2">
          {/* Small severity dot is the only accent; number stays near-black */}
          <span
            className="w-2 h-2 rounded-full self-center shrink-0"
            style={{ background: SEVERITY_COLOR[s] }}
            aria-hidden="true"
          />
          <span className="text-4xl font-bold">{counts[s]}</span>
          <span className="capitalize text-lg text-muted">{s}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ResultsHeader({
  scan,
  url,
}: {
  scan: Scan;
  url: string;
}) {
  return (
    <header className="border-b border-gray-200 px-16 py-24 flex flex-col gap-12">
      <h1 className="text-7xl font-bold">Scan results</h1>

      {/* Heading, overview and score grouped together and left-aligned the empty
          space pools on the right instead of tearing the two apart on wide screens. */}
      <div className="flex items-center gap-24 flex-wrap">
        <div className="flex flex-col gap-6 max-w-4xl">
          <span className="font-medium break-all">{url}</span>
          <div className="flex flex-col gap-3">
            <h2 className="font-semibold text-xl">AI overview</h2>
            <p className="text-xl leading-relaxed">{scan.summary}</p>
          </div>
        </div>

        <div
          className="flex items-center gap-12 shrink-0"
          aria-label={`Radar score: ${scan.score} out of 100`}
        >
          <div className="flex flex-col items-center gap-1">
            <ScoreRing score={scan.score} />
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold">{scan.score}</span>
              <span className="text-muted text-xl">/ 100</span>
            </div>
            <span className="text-sm text-muted tracking-wide uppercase">
              Radar score
            </span>
          </div>
          <SeverityCounts scan={scan} />
        </div>
      </div>
    </header>
  );
}
