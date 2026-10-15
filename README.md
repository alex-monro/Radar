# Radar

A web accessibility scanner built to actually teach you what's wrong. Paste in any public URL and Radar loads the page in a real browser, checks it against WCAG, and gives you the issues in plain English, a screenshot with every problem highlighted, a score, and a fix prompt you can paste straight into an AI tool. Most scanners assume you already know the terminology. Radar explains it.

**Live:** [radar.gogogravity.com](https://radar.gogogravity.com)

Part of Gravity. Sister project to [Orbit](https://alexmonro.com/projects/accessibility-scanner), a Chrome extension that runs the same kind of check inside your browser while you build.

## What it does

Paste a URL, hit scan. Radar opens the page in a real remote browser, scrolls it so lazy-loaded content actually shows up, and runs axe-core against it. You get back:

- Every WCAG violation it finds, ranked by severity, each rewritten in plain language with why it matters and who usually fixes it.
- A full-page screenshot with a box drawn over each problem element.
- Two scores: my own severity-weighted score and Google Lighthouse's accessibility score.
- A copy-ready fix prompt per issue that includes the element's real HTML, so you can hand it to a developer or paste it into Cursor or Claude and get a fix even if you can't read the spec.

No account, no install. No automated tool catches everything, so Radar surfaces issues and explains them, it doesn't certify a page as perfect.

## Why I built it

Most accessibility scanners assume you already understand the terminology. I built Radar for developers, business owners, and people building websites with AI. It runs an axe-core scan, explains what it finds in plain English, shows you where each issue is, and writes a fix prompt you can take to a developer or paste into an AI coding tool. The point isn't just to flag problems. It's to help you understand them.

## Tech stack

- **Next.js 16** with the App Router and Route Handlers, and **React 19**
- **TypeScript** across the stack
- **Tailwind CSS 4** and **styled-components**, with a tsParticles starfield
- **Playwright** (playwright-core) driving a remote **Hyperbrowser** session over CDP
- **axe-core** via @axe-core/playwright for the actual audit
- **OpenAI API** for the plain-English summary of each scan
- **Google PageSpeed Insights** for the Lighthouse score
- **Upstash Redis** for per-IP rate limiting
- **TanStack Query** for running and caching the scan on the client
- **Zod** for server-side validation
- **Vercel** for deployment (Fluid Compute)

## Features

- Scan any public URL server-side, no install or account
- Real headless browser, so it sees the page a user actually sees, lazy-loaded content included
- Full-page screenshot with a highlight box over every flagged element
- Plain-English rewrite of every issue, ranked critical to minor
- Copy-ready AI fix prompt per issue, with the real offending HTML included
- Two scores: a custom axe-severity score and Lighthouse
- Per-IP rate limiting to protect the API budget
- Graceful fallback to Orbit for sites that block automated browsers

## What I learned

Radar came after isolate, my first serious backend project, and let me apply those lessons to a different problem. Instead of sending one audio file to one API, I was taking a public URL, controlling a remote browser, and bringing several services together in one scan. I learned to run the independent calls in parallel, so a slow one like the Lighthouse score doesn't hold up the rest.

I learned to think through the full lifecycle of a request: what enters the route, when it becomes trusted, when work begins, and what happens when something fails. Real scans exposed problems that TypeScript, lint, and a successful build could not, including bad URLs consuming rate limits before validation.

Radar also taught me that more information is not always more useful. I had to decide what a business owner needs first, what a developer may want next, and what could wait. I can already see the decisions I would make earlier on my next full-stack project.

## Running locally

```bash
git clone https://github.com/alex-monro/Radar.git
cd Radar
npm install
```

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Hyperbrowser, OpenAI and both Upstash values are required. `PAGESPEED_API_KEY` is optional. Without it the Lighthouse score is skipped and my own score still returns.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Project structure

```
app/
  api/scan/
    route.ts                      Runs the scan in order: validate, session, rate limit, then each step below
    pipeline/session.ts           Hyperbrowser session and browser connection
    pipeline/prepare-page.ts      Load the page, scroll for lazy content, measure it
    pipeline/capture-screenshot.ts  Full-page screenshot
    pipeline/findings.ts          Run axe and locate each issue on the screenshot
    pipeline/summarize.ts         Plain-English AI summary
    pipeline/calculate-score.ts   Custom severity-weighted score
    pipeline/pagespeed-score.ts   Lighthouse score via PageSpeed Insights
  lib/fetch-scan.ts               Client call to the scan route
  lib/issue-rules.ts              Severity ranking and plain-language rewrites of axe rules
  components/                     ScanForm, ScoreGauge, IssueCard, Issues, results UI
  results/page.tsx                Runs the scan with React Query, renders findings and highlights
  types.ts                        Shared shapes: findings, page size, scan response
```

## What's next

- Multi-page scans instead of one URL at a time
- Saved scan history so you can track a site over time
- Deeper AI fixes that suggest the actual code change, not just a prompt
