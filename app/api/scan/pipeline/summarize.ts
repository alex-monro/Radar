import OpenAI from "openai";
import type { AxeResults } from "axe-core";

const INSTRUCTIONS =
  "Explain this website accessibility scan to someone with no technical background, like a small business owner. Write at a grade-7 reading level, in plain warm prose, two to four short sentences. No bullet points, no bold, no headers, no markdown. Never ask for more information or describe what you would do, you already have everything you need, always produce the actual summary. If issues are few or minor, say so plainly rather than sounding alarming. If there are many or serious issues, be honest and direct without being harsh. Group similar problems together in everyday language, never terms like 'ARIA', 'contrast ratio', or 'DOM'. For each group, say who it affects (for example, people using screen readers) and why it matters to them in concrete terms. Do not explain how to fix anything. Do not use em dashes. Never say 'audit' or 'certified'. Keep the whole summary under 150 words.";

// On a clean scan there are no issues to summarize, so skip the AI call
// entirely rather than sending it an empty issues list (which previously
// made it respond as if it needed more input instead of confirming a
// clean result).
export const summarize = async (
  url: string,
  results: AxeResults,
): Promise<string> => {
  if (results.violations.length === 0) {
    return "No significant accessibility issues were found in this scan.";
  }

  const issues = results.violations
    .map(
      (violation) =>
        `Violation Impact: ${violation.impact} Violation Description: ${violation.description} Number of elements affected: ${violation.nodes.length} `,
    )
    .join("\n");

  // Constructed per call rather than at module load, so a missing key or bad
  // config throws inside the route's try and the finally still releases the
  // Hyperbrowser session.
  const client = new OpenAI();
  const response = await client.responses.create({
    model: "gpt-5.6",
    input: [
      { role: "developer", content: INSTRUCTIONS },
      {
        role: "user",
        content: `Here are the accessibility issues found on ${url}:\n\n${issues}`,
      },
    ],
  });
  return response.output_text;
};
