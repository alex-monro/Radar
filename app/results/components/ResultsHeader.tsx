import type { Scan, Severity } from "../../fixtures/fake-university-scan";

const SEVERITY_ORDER: Severity[] = ["critical", "serious", "moderate", "minor"];

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E7EB" strokeWidth="7" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--color-fg)"
        strokeWidth="7"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}

function SeverityCounts({ findings }: { findings: Scan["findings"] }) {
  const counts = SEVERITY_ORDER.reduce<Record<Severity, number>>(
    (acc, s) => {
      acc[s] = findings.filter((f) => f.severity === s).length;
      return acc;
    },
    { critical: 0, serious: 0, moderate: 0, minor: 0 }
  );

  return (
    <ul className="flex flex-col gap-3 list-none" aria-label="Issue counts by severity">
      {SEVERITY_ORDER.filter((s) => counts[s] > 0).map((s) => (
        <li key={s} className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{counts[s]}</span>
          <span className="text-muted capitalize text-lg">{s}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ResultsHeader({ scan, url }: { scan: Scan; url: string }) {
  return (
    <header className="border-b border-gray-200 px-8 py-40 flex items-center gap-16">
      {/* Left: heading, URL, overview */}
      <div className="flex flex-col gap-8 flex-1 min-w-0">
        <h1 className="text-7xl font-bold">Scan results</h1>
        <span className="font-medium">{url}</span>
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-xl">Overview</h2>
          <p className="max-w-2xl text-lg leading-relaxed">{scan.summary}</p>
        </div>
      </div>

      {/* Right: score + counts, centered vertically against left */}
      <div
        className="flex items-center gap-6 shrink-0"
        aria-label={`Radar score: ${scan.score} out of 100`}
      >
        <div className="flex flex-col items-center gap-1">
          <ScoreRing score={scan.score} />
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold">{scan.score}</span>
            <span className="text-muted text-xl">/ 100</span>
          </div>
        </div>
        <SeverityCounts findings={scan.findings} />
      </div>
    </header>
  );
}
