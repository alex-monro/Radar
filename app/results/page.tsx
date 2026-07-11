"use client";

import { useSearchParams } from "next/navigation";
import ResultsHeader from "@/app/components/ResultsHeader";
import IssuesList from "@/app/components/Issues";

const ResultsPage = () => {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  return (
    <section className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto flex flex-col gap-12 ">
      <ResultsHeader url={url} />
      <IssuesList />
    </section>
  );
};

export default ResultsPage;
