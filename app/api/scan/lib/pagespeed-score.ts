export const getPageSpeedAccessibilityScore = async (
  url: string,
): Promise<number | null> => {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      url,
      key: apiKey,
      category: "accessibility",
      strategy: "desktop",
    });

    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const score = data?.lighthouseResult?.categories?.accessibility?.score;

    return typeof score === "number" ? Math.round(score * 100) : null;
  } catch (err) {
    console.error("PageSpeed Insights request failed:", err);
    return null;
  }
};
