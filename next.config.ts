import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these out of the server bundle and load them from node_modules at
  // runtime. playwright-core ships a data file (browsers.json) that the
  // bundler doesn't trace, so bundling it produces a function that crashes with
  // "Cannot find module .../browsers.json". Marking it external lets Vercel's
  // file tracer include the whole package. @axe-core/playwright depends on it.
  serverExternalPackages: ["@axe-core/playwright", "playwright-core"],
};

export default nextConfig;
