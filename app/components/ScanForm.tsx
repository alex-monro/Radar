"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import isURL from "validator/lib/isURL";

// useRouter is a hook from Next.js Calling it gives you a router object with methods to navigate between pages in code

// Turns whatever the person typed into either a real, safe URL to scan, or
// null if it can't be made into one. Missing "https://" is the most common
// case (people type "example.com", not "https://example.com"), so that gets
// assumed rather than rejected.
//
// isURL (from the `validator` package) catches things the plain URL()
// constructor lets through, e.g. new URL("https://asdkfj") parses fine even
// though "asdkfj" isn't a real domain. isURL's default require_tld: true
// rejects that.
const normalizeUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  const isValid = isURL(candidate, {
    protocols: ["http", "https"],
    require_protocol: true,
  });
  if (!isValid) return null;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
};

const ScanForm = () => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Picks up an error message handed back from a failed scan on the results
  // page (it redirects here rather than showing a dead-end "try again" on
  // its own loading screen). Runs once on mount, then clears the query
  // string so refreshing the page doesn't keep re-showing the same error.
  useEffect(() => {
    const incomingError = searchParams.get("error");
    const incomingUrl = searchParams.get("url");

    if (incomingError) {
      setError(incomingError);
    }
    if (incomingUrl) {
      setUrl(incomingUrl);
    }
    if (incomingError || incomingUrl) {
      router.replace("/");
    }
    // Only ever meant to run once, off the URL the page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // Submitting from home always means "run a fresh scan", so clear any
    // cached result for this url before navigating. Reloading the results
    // page still reuses the cache, since a reload never comes through here.
    // The key must match the one built in results/page.tsx.
    sessionStorage.removeItem(`radar:scan:${normalized}`);
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
          className="flex-1 px-6 py-6 bg-transparent outline-none text-xl autofill:!text-xl"
        />
        <button
          type="submit"
          className="bg-footer text-on-dark px-10 py-6 text-xl font-mediums"
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
