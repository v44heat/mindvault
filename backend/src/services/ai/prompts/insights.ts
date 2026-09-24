import { z } from "zod";
import { SAFETY_RULES, JSON_ONLY_INSTRUCTION } from "./safety";

export const insightsSchema = z.object({
  insights: z
    .array(
      z.object({
        insight: z.string(),
        supportingEntryNumbers: z.array(z.number().int()).max(10),
        confidence: z.enum(["low", "medium", "high"]),
      })
    )
    .max(8),
});

export type InsightsResult = z.infer<typeof insightsSchema>;

export function buildInsightsPrompt(entries: { title: string; text: string; date: string }[]) {
  const system = `${SAFETY_RULES}

You look for recurring patterns across someone's journal entries - things like topics that
come up often, situations that tend to coincide, or habits mentioned repeatedly. These are
observations about journal *content*, never psychological or medical conclusions about the
person. Only report a pattern if it is actually supported by at least two of the provided
entries; if you don't see a real pattern, return fewer insights rather than inventing one.
${JSON_ONLY_INSTRUCTION}

The JSON object must have exactly one key, "insights", an array of objects each with:
- "insight": one sentence describing the pattern, written directly to the person ("You...")
- "supportingEntryNumbers": the entry numbers (as given below) that support this insight
- "confidence": "low", "medium", or "high" based on how many entries support it and how clear the pattern is`;

  const entriesBlock = entries
    .map((e, i) => `Entry ${i + 1} (${e.date})${e.title ? ` - "${e.title}"` : ""}:\n${e.text}`)
    .join("\n\n---\n\n");

  const user = `Here are recent journal entries:\n\n${entriesBlock}`;

  return { system, user };
}
