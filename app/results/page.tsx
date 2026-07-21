"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResultsHeader from "@/app/components/ResultsHeader";
import IssuesList from "@/app/components/Issues";
import Disclaimer from "@/app/components/Disclaimer";
import type { AxeResults } from "axe-core";

type ScanError = {
  message: string;
  // Rate-limit errors aren't fixed by clicking "try again" a second later,
  // so they don't get a retry button, unreachable-site/timeout errors do.
  retryable: boolean;
};

const ResultsContent = () => {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const router = useRouter();

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [results, setResults] = useState<AxeResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<ScanError | null>(null);

  const runScan = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      // fetch() just means "go get this data, and I expect something to come back"
      const res = await fetch("/api/scan", {
        // Post Just means I have the option to send you data
        method: "POST",
        // content type is just saying "hey, I'm sending you JSON data, so please treat it as such"
        headers: { "Content-Type": "application/json" },
        // Body is the actual data im sending. if I was doing a GET, this option woudnt be allowed
        body: JSON.stringify({ url }),
      });

      // A failure on the server (an unreachable site, a crash) can come back
      // as a plain error page instead of JSON, so this parse itself needs a
      // try/catch, not just the outer fetch.
      let data: { error?: string; [key: string]: unknown } | null = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("NOT_JSON");
      }

      if (!res.ok) {
        if (res.status === 429) {
          setError({
            message:
              data?.error ??
              "You've hit the daily scan limit. Try again tomorrow.",
            retryable: false,
          });
        } else {
          setError({
            message:
              data?.error ??
              "We couldn't scan that site. It might be unreachable, blocking automated visits, or it took too long to load.",
            retryable: true,
          });
        }
        setLoading(false);
        return;
      }

      setResults(data.results as AxeResults);
      setScreenshot(data.screenshot as string);
      setSummary(data.summary as string);
      setScore(data.score as number);
      setLoading(false);
    } catch {
      setError({
        message:
          "Something went wrong reaching the scanner. Check your connection and try again.",
        retryable: true,
      });
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!url) {
      router.push("/");
      return;
    }
    runScan();
  }, [url, runScan, router]);

  if (!url) {
    return null;
  }

  if (loading) {
    return (
      <div>
        <p className="text-lg">Scanning for accessibility issues...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-start gap-6 py-24">
        <p className="text-lg" role="alert">
          {error.message}
        </p>
        {error.retryable && (
          <button
            onClick={runScan}
            className="bg-footer text-on-dark px-8 py-4 rounded-lg text-lg font-medium"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto flex flex-col gap-12 ">
      <ResultsHeader url={url} summary={summary} score={score} />
      <Disclaimer issueCount={results?.violations.length ?? 0} />
      <IssuesList results={results} screenshot={screenshot} />
    </section>
  );
};

const ResultsPage = () => {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  );
};

export default ResultsPage;
