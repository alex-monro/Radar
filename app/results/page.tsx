"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResultsHeader from "@/app/components/ResultsHeader";
import IssuesList from "@/app/components/Issues";
import type { Finding, PageDimensions } from "@/app/types";
import type { AxeResults } from "axe-core";
import Loader from "../components/Loader";
import ScanComplete from "../components/ScanComplete";

const ResultsContent = () => {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const router = useRouter();

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [results, setResults] = useState<AxeResults | null>(null);
  // Three real states, so one variable rather than two booleans. Two booleans
  // would allow a fourth, meaningless combination (scanning AND complete at the
  // same time); this shape makes that impossible instead of merely unlikely.
  const [phase, setPhase] = useState<"scanning" | "complete" | "results">(
    "scanning",
  );
  const [summary, setSummary] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [dimensions, setDimensions] = useState<PageDimensions | null>(null);

  // Tracks which url we've already kicked off a scan for. React runs effects
  // twice in dev (Strict Mode); without this guard that fires two scans at
  // once, and on the one-concurrent-session plan the second instantly fails
  // with a "busy" error. Only scan a given url once per mount.
  const scannedUrl = useRef<string | null>(null);

  // Sends the person back to the home page with the failure explained there,
  // instead of stranding them on this loading screen with a dead-end "try
  // again" button. Home already has the input + error UI built, so this
  // reuses it rather than duplicating a second error surface here.
  const goHomeWithError = (message: string, attemptedUrl: string) => {
    router.push(
      `/?error=${encodeURIComponent(message)}&url=${encodeURIComponent(attemptedUrl)}`,
    );
  };

  useEffect(() => {
    if (!url) {
      router.push("/");
      return;
    }

    if (scannedUrl.current === url) {
      return;
    }
    scannedUrl.current = url;

    const cacheKey = `radar:scan:${url}`;

    // On reload or a return visit, reuse the last scan for this url from
    // sessionStorage instead of running a fresh (slow, metered) scan again.
    // A real re-scan would clear this / go through a dedicated action later.
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setResults((data.results as AxeResults) ?? null);
        setScreenshot((data.screenshot as string) ?? null);
        setSummary((data.summary as string) ?? null);
        setScore((data.score as number) ?? null);
        setFindings((data.findings as Finding[]) ?? []);
        setDimensions((data.dimensions as PageDimensions) ?? null);
        // Straight to results on a cache hit. Nothing was actually scanned, so
        // playing the completion animation would be celebrating a lie.
        setPhase("results");
        return;
      }
    } catch {
      // ignore it and fall through to a fresh scan.
    }

    const runScan = async () => {
      setPhase("scanning");

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
        if (!data) {
          goHomeWithError(
            "Something went wrong reaching the scanner. Check your connection and try again.",
            url,
          );
          return;
        }

        if (!res.ok) {
          const message =
            res.status === 429
              ? (data?.error ??
                "You've hit the daily scan limit. Try again tomorrow.")
              : (data?.error ??
                "We couldn't scan that site. It might be unreachable, blocking automated visits, or it took too long to load.");
          goHomeWithError(message, url);
          return;
        }

        setResults(data.results as AxeResults);
        setScreenshot(data.screenshot as string);
        setSummary(data.summary as string);
        setScore(data.score as number);
        setFindings((data.findings as Finding[]) ?? []);
        setDimensions((data.dimensions as PageDimensions) ?? null);
        setPhase("complete");

        // Cache the result so a reload doesn't trigger another scan. Screenshots
        // are large, so guard against sessionStorage quota errors: if it can't
        // fit, we just skip caching and a reload will scan again (no worse than
        // before).
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              results: data.results,
              screenshot: data.screenshot,
              summary: data.summary,
              score: data.score,
              findings: data.findings,
              dimensions: data.dimensions,
            }),
          );
        } catch {
          // Storage full (usually the screenshot). Skip caching.
        }
      } catch {
        goHomeWithError(
          "Something went wrong reaching the scanner. Check your connection and try again.",
          url,
        );
      }
    };

    runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // After the scan completes, show the "Scan Complete" animation for a moment
  useEffect(() => {
    if (phase !== "complete") return;
    const timer = setTimeout(() => setPhase("results"), 3000);
    return () => clearTimeout(timer);
  }, [phase]);

  if (!url) {
    return null;
  }

  if (phase !== "results") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center ">
        {phase === "scanning" ? <Loader /> : <ScanComplete />}
      </div>
    );
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto flex flex-col gap-12 ">
      <ResultsHeader
        url={url}
        summary={summary}
        score={score}
        // Drives the heavier honesty paragraph. Keyed off the real violation
        // count rather than a perfect score, since the score comes from
        // PageSpeed and can read 100 while axe still found something.
        clean={(results?.violations.length ?? 0) === 0}
      />
      <IssuesList
        url={url}
        results={results}
        screenshot={screenshot}
        findings={findings}
        dimensions={dimensions}
      />
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
