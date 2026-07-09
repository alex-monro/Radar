import { fakeScan } from "../fixtures/fake-university-scan";
import ResultsHeader from "./components/ResultsHeader";
import IssuesSection from "./components/IssuesSection";

// Story 1.1: fixture data only
export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  const scan = fakeScan;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <ResultsHeader scan={scan} url={url ?? scan.url} />
      <IssuesSection scan={scan} />
    </div>
  );
}
