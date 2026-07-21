"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// useRouter is a hook from Next.js Calling it gives you a router object with methods to navigate between pages in code

// Turns whatever the person typed into either a real, safe URL to scan, or
// null if it can't be made into one. Missing "https://" is the most common
// case (people type "example.com", not "https://example.com"), so that gets
// assumed rather than rejected.
const normalizeUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    // Only allow http/https. Without this check someone could submit
    // something like "javascript:..." or "file:///" and have the server
    // try to visit it.
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const ScanForm = () => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // I promise "e" will be this specific shape.
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError(
        url.trim()
          ? "That doesn't look like a working website address. Try something like example.com."
          : "Enter a website address to scan.",
      );
      return;
    }

    setError(null);
    router.push(`/results?url=${encodeURIComponent(normalized)}`);
  };

  return (
    // OnSubmit Passes an "Event Object" to the function.
    // noValidate hands all validation to our own code above instead of the
    // browser's built-in url-field check, so the message is ours, plain
    // language, and consistent, not a generic browser tooltip.
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <label htmlFor="url-input" className="font-medium">
        Enter a website URL
      </label>
      <div
        className={`flex border rounded-lg overflow-hidden ${
          error ? "border-red-500" : "border-fg"
        }`}
      >
        <input
          id="url-input"
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "url-input-error" : undefined}
          className="flex-1 px-6 py-6 bg-transparent outline-none text-xl"
        />
        <button
          type="submit"
          className="bg-footer text-on-dark px-10 py-6 text-xl font-medium"
        >
          Scan
        </button>
      </div>
      {error && (
        <p id="url-input-error" role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
    </form>
  );
};

export default ScanForm;
