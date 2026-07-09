"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScanForm() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    router.push(`/results?url=${encodeURIComponent(url.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="url-input" className="font-medium">Enter a website URL</label>
      <div className="flex border border-fg rounded-lg overflow-hidden">
        <input
          id="url-input"
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 px-6 py-6 bg-transparent outline-none text-xl"
        />
        <button type="submit" className="bg-footer text-on-dark px-10 py-6 text-xl font-medium">
          Scan
        </button>
      </div>
    </form>
  );
}
