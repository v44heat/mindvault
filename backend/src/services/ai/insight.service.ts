import { JournalEntry } from "@models/JournalEntry.model";
import { AiInsight, IAiInsight } from "@models/AiInsight.model";
import { AppError } from "@utils/asyncHandler";
import { generateStructured } from "./ai.service";
import { buildInsightsPrompt, insightsSchema } from "./prompts/insights";

const MAX_ENTRIES_FOR_INSIGHTS = 40;
const MAX_ENTRY_CHARS = 2000; // insights only need a slice of each entry, not the full text

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export async function generateInsights(userId: string): Promise<IAiInsight[]> {
  const entries = await JournalEntry.find({ userId, isDeleted: false })
    .sort({ entryDate: -1 })
    .limit(MAX_ENTRIES_FOR_INSIGHTS);

  if (entries.length < 3) {
    throw new AppError("Write a few more entries before generating insights", 400, "NOT_ENOUGH_ENTRIES");
  }

  const promptEntries = entries.map((e) => ({
    title: e.title,
    text: truncate(e.contentText, MAX_ENTRY_CHARS),
    date: e.entryDate.toISOString().slice(0, 10),
  }));

  const { system, user } = buildInsightsPrompt(promptEntries);
  const { insights } = await generateStructured(system, user, insightsSchema, 900);

  const created = await Promise.all(
    insights.map((i) =>
      AiInsight.create({
        userId,
        insight: i.insight,
        confidence: i.confidence,
        supportingEntryIds: i.supportingEntryNumbers
          .map((n) => entries[n - 1]?._id)
          .filter((id): id is NonNullable<typeof id> => Boolean(id)),
      })
    )
  );

  return created;
}

export async function listInsights(userId: string, includeDismissed = false) {
  const filter: Record<string, unknown> = { userId };
  if (!includeDismissed) filter.isDismissed = false;
  return AiInsight.find(filter).sort({ discoveredAt: -1 }).populate("supportingEntryIds", "title entryDate");
}

async function findOwnedInsightOrThrow(id: string, userId: string): Promise<IAiInsight> {
  const insight = await AiInsight.findOne({ _id: id, userId });
  if (!insight) {
    throw new AppError("Insight not found", 404, "INSIGHT_NOT_FOUND");
  }
  return insight;
}

export async function dismissInsight(id: string, userId: string): Promise<IAiInsight> {
  const insight = await findOwnedInsightOrThrow(id, userId);
  insight.isDismissed = true;
  await insight.save();
  return insight;
}

export async function saveInsight(id: string, userId: string): Promise<IAiInsight> {
  const insight = await findOwnedInsightOrThrow(id, userId);
  insight.isSaved = true;
  await insight.save();
  return insight;
}
