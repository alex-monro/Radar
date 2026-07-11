"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResultsHeader from "@/app/components/ResultsHeader";
import IssuesList from "@/app/components/Issues";

const ResultsContent = () => {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const router = useRouter();

  useEffect(() => {
    if (!url) {
      router.push("/");
    }
  }, [url]);

  return (
    <section className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto flex flex-col gap-12 ">
      <ResultsHeader url={url} />
      <IssuesList />
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
