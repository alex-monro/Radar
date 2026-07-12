"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResultsHeader from "@/app/components/ResultsHeader";
import IssuesList from "@/app/components/Issues";
import type { AxeResults } from "axe-core";

const ResultsContent = () => {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const router = useRouter();

  const [results, setResults] = useState<AxeResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      router.push("/");
      return;
    }

    const runScan = async () => {
      setLoading(true);
      // fetch() just means "go get this data, and I expect something to come back"
      const res = await fetch("/api/scan", {
        // Post Just means I have the option to send you data
        method: "POST",
        // content type is just saying "hey, I'm sending you JSON data, so please treat it as such"
        headers: { "Content-Type": "application/json" },
        // Body is the actual data im sending. if I was doing a GET, this option woudnt be allowed
        // what
        body: JSON.stringify({ url }),
      });
      // res.json() just means "hey, I expect the data to come back as JSON, so please parse it for me"
      const data = await res.json();
      console.log("data", data);
      setResults(data.results);
      setScreenshot(data.screenshot);
      setLoading(false);
    };

    runScan();
  }, [url]);

  return loading ? (
    <div>
      <p className="text-lg">Scanning for accessibility issues...</p>
    </div>
  ) : (
    <section className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto flex flex-col gap-12 ">
      <ResultsHeader url={url} />
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
