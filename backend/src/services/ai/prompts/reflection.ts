import { z } from "zod";
import { SAFETY_RULES, JSON_ONLY_INSTRUCTION } from "./safety";

export const reflectionSchema = z.object({
  summary: z.string(),
  majorEvents: z.array(z.string()).max(10),
  mostDiscussedTopics: z.array(z.string()).max(10),
  moodOverview: z.string(),
  achievements: z.array(z.string()).max(10),
  challenges: z.array(z.string()).max(10),
  lessons: z.array(z.string()).max(5),
  reflectionQuestions: z.array(z.string()).max(5),
});

export type ReflectionResult = z.infer<typeof reflectionSchema>;

export type ReflectionPeriod = "day" | "week" | "month";

const PERIOD_LABEL: Record<ReflectionPeriod, string> = {
  day: "day",
  week: "week",
  month: "month",
};

export function buildReflectionPrompt(period: ReflectionPeriod, entries: { title: string; text: string; date: string }[]) {
  const label = PERIOD_LABEL[period];

  const system = `${SAFETY_RULES}

You help someone reflect on their journal entries from the past ${label}. Keep every conclusion
grounded in the entries provided - never invent achievements, events, or numbers that are not
in the text. If there is not enough material to support a field, return an empty array or a
brief honest statement rather than inventing content. ${JSON_ONLY_INSTRUCTION}

The JSON object must have exactly these keys:
- "summary": 2-4 sentence overview of the ${label}
- "majorEvents": notable events mentioned across the entries
- "mostDiscussedTopics": recurring topics, ordered by how often they appear
- "moodOverview": one sentence describing the general mood pattern across entries (not a diagnosis)
- "achievements": things the person accomplished, only if mentioned
- "challenges": difficulties mentioned, only if present
- "lessons": lessons or insights the person seems to draw themselves, only if evident in the text
- "reflectionQuestions": 2-4 open-ended questions for the person to consider`;

  const entriesBlock = entries
    .map((e, i) => `Entry ${i + 1} (${e.date})${e.title ? ` - "${e.title}"` : ""}:\n${e.text}`)
    .join("\n\n---\n\n");

  const user = `Here are the journal entries from this ${label}:\n\n${entriesBlock}`;

  return { system, user };
}
