export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;

  return (
    <div>
      <p>Results for: {url}</p>
    </div>
  );
}
