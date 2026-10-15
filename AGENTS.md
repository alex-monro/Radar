<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- Shared onboarding for every developer and their AI agent. Personal notes go
in AGENTS.local.md / CLAUDE.local.md, which are git-ignored. Keep this file
under 200 lines: only things that cause damage when forgotten. -->

# Radar

Web accessibility scanner. A visitor enters a URL; the server loads it in a
remote browser, runs axe-core, and returns WCAG violations in plain English
with a highlighted screenshot, a score, and a copy-ready AI fix prompt.
Live at radar.gogogravity.com, deployed on Vercel from `main`.

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, TanStack
Query 5, Zod 4, playwright-core + @axe-core/playwright, Hyperbrowser (remote
browser), OpenAI (summary), Upstash Redis (rate limit), Google PageSpeed (score).

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your own keys. Hyperbrowser
   and OpenAI are required, or scans return 500. Upstash is optional locally:
   without it `next dev` skips the rate limit (production never skips).
   `PAGESPEED_API_KEY` is optional: without it `calculateScore` is used. Never
   commit `.env.local`; `.gitignore` ignores every `.env*` except the example.
3. `npm run dev`, then before any commit: `npx tsc --noEmit` and `npm run lint`.

## Rules

- **Every scan costs money.** One POST to `/api/scan` starts a paid
  Hyperbrowser session, an OpenAI call and a PageSpeed call. Never add code
  that can fire a scan more than once per visitor action.
- **Keep the scan query's auto-refetches off.** In `app/results/page.tsx` the
  `useQuery` sets `retry`, `refetchOnWindowFocus`, `refetchOnReconnect` and
  `refetchOnMount` to `false`. TanStack's defaults turn all of these on, and
  each one is another billed scan. Do not remove them.
- **Do not pass TanStack's `signal` to `fetch` in `fetchScan`.** React Strict
  Mode would abort and re-fire the scan in development.
- **Always release the browser session.** Everything after `createSession()` in
  `route.ts` lives inside one `try`, and the `finally` closes the browser and
  calls `stop()`. Any new step goes inside that `try`.
- **Session before rate limit, on purpose.** A "busy" rejection must not spend
  the visitor's daily rate-limit count or a PageSpeed call.
- **Errors visitors see are written in the route.** Every error response is
  `{ error: "<plain-English message>" }` with a real status code. `fetchScan`
  throws that message; the results page redirects to `/?error=…&url=…` and
  `ScanForm` shows it. Write new messages for a non-technical reader.
- **Accessibility is the product.** Radar must pass its own bar: WCAG 2.x AA
  contrast, semantic HTML, keyboard access, and every animation must respect
  `prefers-reduced-motion` without losing its message (see `ScanComplete.tsx`).
- **No fixed waits where a real signal exists.** Prefer events
  (`onAnimationEnd`, Playwright load states) over `setTimeout` /
  `waitForTimeout` with a guessed duration.
- **Shared types live in `app/types.ts`.** `ScanResponse` mirrors what
  `route.ts` returns; change both together.
- **Check the docs before choosing a pattern.** Next 16 and TanStack Query 5
  both changed APIs that older tutorials still show (e.g. v4 `isLoading` is
  v5 `isPending`). Old code in git history is not the reference.

## Working with agents

- **Cite sources.** Back any API, option or version claim with a docs link or
  a `file:line`. If unsure, say so. If an earlier answer was wrong, correct it
  plainly.
- **Show the output.** Never claim a command, test or check ran unless its
  output is in the conversation. Label what was assumed separately from what
  was verified.
- **Project skills live in `.claude/skills/`** and are committed, so every
  developer's agent gets them. `prior-art-check` runs before hand-rolling a
  feature or picking a pattern: platform first, then installed deps, then
  libraries, each with a link. Add new shared skills there; personal ones go
  in `~/.claude/skills/`.

## Architecture

```
app/
  page.tsx                 home: ScanForm
  results/page.tsx         results: useQuery → Loader → ScanComplete → results
  providers.tsx            QueryClientProvider (client component)
  layout.tsx               wraps Nav + main in Providers
  lib/fetch-scan.ts        POST /api/scan; throws the route's error message
  lib/issue-rules.ts       all axe-rule content: severity, ranking, plain-language rewrites
  types.ts                 Finding, PageDimensions, ScanResponse
  components/              UI. Loader and ScanComplete use styled-components; the rest is Tailwind
  api/scan/route.ts        the scan, in order (below)
  api/scan/pipeline/       one file per scan step, used only by route.ts
```

Scan flow in `app/api/scan/route.ts`:

1. Parse JSON and validate `url` with Zod (`z.httpUrl()`). 400 on failure.
2. `createSession()` (Hyperbrowser). Retryable failure → 503 "busy", else 500.
3. Upstash sliding-window rate limit, 50 per IP per 24h. 429 when exceeded.
   Skipped only in non-production with no Upstash keys.
4. Start the PageSpeed score in the background.
5. `connectBrowser` → `openUrl` (502 if the site refuses automated visits) →
   `scrollAndMeasure` → `captureScreenshot` → `runAxe` → `buildFindings` →
   `summarize` → score (PageSpeed, else `calculateScore`).
6. `finally`: close the browser, stop the session.

`maxDuration` is 300s. Client flow: `ScanForm` validates with `validator`'s
`isURL` and pushes `/results?url=…`; the results page runs the query, keyed
`["scan", url]`, cached 15 minutes (`gcTime`).

## Known gaps

- An OpenAI failure fails the whole scan (`summarize.ts` has no catch), even
  though the axe results exist. The screenshot already degrades to `null`.
- `request.signal` abort never fires on Vercel unless `supportsCancellation` is
  enabled in `vercel.json`, which this repo doesn't have, so a visitor leaving
  mid-scan doesn't stop the session early.
- `prepare-page.ts` still has fixed waits (3s after load, 500ms after scroll).
- The TanStack cache lives in memory: a reload re-runs the scan.

## Planned

Job-based polling: POST returns a job id, the scan runs after the response,
progress is stored in Redis, and the results page polls
`GET /api/scan/[id]` with `refetchInterval` for real loader stages. This is
also the base for accounts and saved scans, so agree on the job record's
shape before building either.

### Google sign-in

Accounts via Google, using OAuth 2.0 / OpenID Connect, so visitors can save
and revisit scans.

Not decided yet: the auth library, where sessions live, and how a saved scan
links to a user and a job. Decide these together with the polling job record,
and check current docs before picking a library.

When it lands: the Google client secret goes in `.env.local` only, with its
name added to `.env.example`.
