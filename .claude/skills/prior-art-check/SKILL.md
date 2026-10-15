---
name: prior-art-check
description: Use before hand-rolling any non-trivial feature — data fetching, caching, complex state, forms, tables, dates, auth, routing — or whenever a component is about to pass roughly five useState calls or fifty lines of custom logic. Also use when I ask what the modern or standard way to do something is.
---

# Prior art check

Find the current standard solution before writing a custom one. Work the steps in order.
Do not skip to code, and do not answer any step from memory.

## Hard rule

No library, API, or version is named without a link. If you cannot produce a URL for it,
you do not know it exists, and you say so instead of naming it. A missing link is visible.
Unearned confidence is not.

If you cannot reach the network, stop and say so. Do not substitute recollection for research.

## Steps

**1. State the problem in one sentence, with no solution words in it.**
"Keep a list of search results in sync with a query the user is typing" — not
"add React Query." Naming a solution in the problem statement ends the search early.

**2. Pin the constraints from the actual project, not from assumption.**
Read `package.json` for the framework and its major version, the language, the bundler,
and whether this is client, server, or both. Read the project's AGENTS.md or CLAUDE.md
for anything it forbids. Quote what you found.

**3. Check the platform first.**
Before any library, ask whether the language, the browser, or the framework already
covers this. Check the framework's own documentation. Many things that needed a package
three years ago are now built in. A platform primitive beats a dependency every time.

**4. Check what is already installed.**
Grep `package.json` and the codebase. A library already in the project, or a pattern
already used in a neighbouring slice, beats introducing a fourth way to do the same thing.

**5. Find two to four candidates, each with evidence.**
For each one record: the npm page, the date of the last publish, weekly downloads, the
repo's last commit, and whether its peer dependencies accept the versions from step 2.

**6. Eliminate, with reasons stated.**
Out: no release in roughly twelve months, an archived or read-only repo, peer
dependencies that conflict with step 2, or a licence the project cannot take.
Say which candidate died and why. Do not silently drop one.

**7. Verify the survivor actually solves it.**
Open the current documentation and quote the specific API that addresses the problem
from step 1. If you cannot find that API in the docs, it does not exist, whatever you
remember. Note the doc version you read.

**8. Price it.**
Bundle size, how much of it the project would actually use, how hard it is to remove
later, and what a teammate would need to learn.

**9. Recommend in one line, then argue against yourself.**
Give the recommendation, then the strongest honest case for not taking it — including
the case for hand-rolling, when the need is genuinely small.

## Output

| | |
|---|---|
| Problem | one sentence, from step 1 |
| Constraints | stack and versions, quoted from package.json |
| Platform option | built-in that covers it, or "none", with a docs link |
| Already installed | existing dep or pattern that covers it, or "none" |
| Candidates | name, link, last publish, weekly downloads, peer-dep verdict |
| Eliminated | which, and why |
| Recommendation | one line |
| Case against | the strongest objection |

Then stop and wait for a decision. Do not begin implementing.

## Triggers worth catching

- More than about five `useState` calls in one component, or several booleans that are
  really one status, means `useReducer` or a state machine.
- `useEffect` plus fetch plus loading plus error plus caching means server state.
  That is a data-fetching library's job, not a hand-written one.
- Manual form state with validation means a form library plus a schema validator.
- Hand-written date arithmetic means a date library, or `Intl` if the need is small.
- Custom token storage and refresh means the identity provider's own SDK.
- A sortable, filterable, paginated table means a table library.
- Polling, retries, or backoff written by hand usually already exists in a dep.

## Rule

Never silently hand-roll what a well-adopted library already solves. Hand-rolling is a
legitimate choice, but it is one I make knowingly, after seeing the alternative priced.
