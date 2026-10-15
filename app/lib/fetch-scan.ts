import type { ScanResponse } from "@/app/types";

export const fetchScan = async (url: string) => {
  // 1. POST the url to /api/scan

  const response = await fetch("/api/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error);
  }

  // 2. return the JSON body
  return body as ScanResponse;
};
