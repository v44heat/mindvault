import { z } from "zod";
import { SAFETY_RULES, JSON_ONLY_INSTRUCTION } from "./safety";

export const entryAnalysisSchema = z.object({
  summary: z.string(),
  themes: z.array(z.string()).max(10),
  emotions: z.array(z.string()).max(10),
  keyEvents: z.array(z.string()).max(10),
  positiveMoments: z.array(z.string()).max(10),
  challenges: z.array(z.string()).max(10),
  actionItems: z.array(z.string()).max(10),
  reflectionQuestions: z.array(z.string()).max(5),
});

export type EntryAnalysisResult = z.infer<typeof entryAnalysisSchema>;

export function buildEntryAnalysisPrompt(entryText: string, entryTitle: string) {
  const system = `${SAFETY_RULES}

You help someone reflect on a single journal entry they just wrote. ${JSON_ONLY_INSTRUCTION}

The JSON object must have exactly these keys:
- "summary": a 1-3 sentence neutral summary of what the entry describes
- "themes": short topic labels present in the entry (e.g. "programming", "family")
- "emotions": emotion words the entry's language suggests (not diagnoses)
- "keyEvents": concrete events or facts mentioned
- "positiveMoments": positive moments or wins mentioned, if any (can be empty array)
- "challenges": difficulties or frustrations mentioned, if any (can be empty array)
- "actionItems": follow-up tasks implied by the entry, if any (can be empty array)
- "reflectionQuestions": 1-3 open-ended questions to help the writer reflect further`;

  const user = `Journal entry title: ${entryTitle || "(untitled)"}

Journal entry text:
"""
${entryText}
"""`;

  return { system, user };
}
