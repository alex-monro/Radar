"use client";

import { Suspense, useState } from "react";
import { useSearchParams, redirect } from "next/navigation";
import { useQuery, skipToken } from "@tanstack/react-query";
import { fetchScan } from "../lib/fetch-scan";
import ResultsHeader from "@/app/components/ResultsHeader";
import IssuesList from "@/app/components/Issues";
import Loader from "../components/Loader";
import ScanComplete from "../components/ScanComplete";
// rebuilt following this tutorial https://www.youtube.com/watch?v=8K1N3fE-cDs
const ResultsContent = () => {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  // Flips when the ScanComplete checkmark finishes drawing.
  const [showResults, setShowResults] = useState(false);

  const { data, isPending, isError, error } = useQuery({
    // queryFn is the function useQuery calls to get the data. Here that's your
    //https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries
    // if there is a url, call fetchScan(url), otherwise skip the query.
    queryFn: url ? async () => fetchScan(url) : skipToken,
    queryKey: ["scan", url], // this is just a unique identify for the query. all this is used for is the cache. we identify each scan with the word "scan" and then the url so that if we scan the same url, we can just use the cched resustls.
    retry: false, // don't retry on failure
    refetchOnWindowFocus: false, // don't refetch when the window regains focus
    refetchOnReconnect: false, // don't refetch when the browser reconnects to the internet
    refetchOnMount: false, // don't refetch when the if someone backs then comes back, just show the cache
    gcTime: 15 * 60 * 1000, // Clear the cache after 15 minutes. default is 5 minutes.
  });
  if (!url) {
    redirect("/");
  }

  if (isError) {
    redirect(
      `/?error=${encodeURIComponent(error.message)}&url=${encodeURIComponent(url)}`,
    );
  }
  if (isPending) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center ">
        <Loader />
      </div>
    );
  }

  if (!showResults) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center ">
        <ScanComplete onDone={() => setShowResults(true)} />
      </div>
    );
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto flex flex-col gap-12 ">
      <ResultsHeader
        url={url}
        summary={data.summary}
        score={data.score}
        clean={(data.results?.violations.length ?? 0) === 0}
      />
      <IssuesList
        url={url}
        results={data.results}
        screenshot={data.screenshot}
        findings={data.findings}
        dimensions={data.dimensions}
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
