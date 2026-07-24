import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these out of the server bundle and load them from node_modules at
  // runtime. playwright-core ships a data file (browsers.json) that the
  // bundler doesn't trace, so bundling it produces a function that crashes with
  // "Cannot find module .../browsers.json". Marking it external lets Vercel's
  // file tracer include the whole package. @axe-core/playwright depends on it.
  serverExternalPackages: ["@axe-core/playwright", "playwright-core"],
  // Belt and suspenders for the same issue: force the scan function's file
  // trace to include browsers.json, the data file playwright-core loads at
  // runtime and that the tracer misses on its own. The Next-native equivalent
  // of Vercel's includeFiles, and the correct form for an App Router handler.
  outputFileTracingIncludes: {
    "/api/scan": ["./node_modules/playwright-core/browsers.json"],
  },
};

export default nextConfig;
