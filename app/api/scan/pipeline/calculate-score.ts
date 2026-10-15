import type { AxeResults } from "axe-core";

// Severity weights axe-core/Deque itself suggests for critical/serious/moderate/minor.
const IMPACT_WEIGHTS: Record<string, number> = {
  critical: 4,
  serious: 2,
  moderate: 1,
  minor: 0.5,
};

// How much a rule failing on more elements should count against the score.
// 1 element = no boost (multiplier 1). More elements add weight, but each
// doubling adds less than the last, so one repeated rule can't dominate the
// score just by matching a lot of elements.
const nodeMultiplier = (nodeCount: number): number => 1 + Math.log2(nodeCount);

// How hard each point of failed weight should cost, off a clean 100.
const PENALTY = 1.16;

// Flat deduction from 100, scaled by severity and how many elements a rule
// actually failed on. Deliberately NOT a weighted average against `passes` —
// most pages pass far more rules than they fail (~90 rules exist total), so
// counting passes let a big pile of mostly-irrelevant passing rules dilute
// real violations down to a too-generous score.
export const calculateScore = (results: AxeResults): number => {
  const failedWeight = results.violations.reduce((sum, violation) => {
    const severity = IMPACT_WEIGHTS[violation.impact ?? "minor"] ?? 1;
    return sum + severity * nodeMultiplier(violation.nodes.length);
  }, 0);

  return Math.max(0, Math.round(100 - failedWeight * PENALTY));
};
