import { JournalEntry, IJournalEntry } from "@models/JournalEntry.model";
import { AppError } from "@utils/asyncHandler";
import { generateStructured } from "./ai.service";
import { buildEntryAnalysisPrompt, entryAnalysisSchema } from "./prompts/entryAnalysis";
import { buildReflectionPrompt, reflectionSchema, ReflectionPeriod, ReflectionResult } from "./prompts/reflection";

const MAX_ENTRY_CHARS = 6000; // keep per-entry context bounded and cheap

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

/**
 * Analyzes a single entry and persists the result on the entry itself.
 * Only ever reads/writes an entry already scoped to the requesting user.
 */
export async function analyzeEntry(entryId: string, userId: string): Promise<IJournalEntry> {
  const entry = await JournalEntry.findOne({ _id: entryId, userId, isDeleted: false });
  if (!entry) {
    throw new AppError("Journal entry not found", 404, "ENTRY_NOT_FOUND");
  }
  if (!entry.contentText.trim()) {
    throw new AppError("This entry doesn't have enough content to analyze yet", 400, "ENTRY_TOO_SHORT");
  }

  const { system, user } = buildEntryAnalysisPrompt(truncate(entry.contentText, MAX_ENTRY_CHARS), entry.title);
  const result = await generateStructured(system, user, entryAnalysisSchema, 900);

  entry.aiAnalysis = { ...result, analyzedAt: new Date() };
  await entry.save();

  return entry;
}

async function loadEntriesForRange(userId: string, from: Date, to: Date) {
  return JournalEntry.find({
    userId,
    isDeleted: false,
    entryDate: { $gte: from, $lt: to },
  }).sort({ entryDate: 1 });
}

async function reflect(period: ReflectionPeriod, userId: string, from: Date, to: Date): Promise<{
  result: ReflectionResult;
  entryCount: number;
}> {
  const entries = await loadEntriesForRange(userId, from, to);
  if (entries.length === 0) {
    throw new AppError(`No entries found for that ${period}`, 400, "NO_ENTRIES");
  }

  const promptEntries = entries.map((e) => ({
    title: e.title,
    text: truncate(e.contentText, MAX_ENTRY_CHARS),
    date: e.entryDate.toISOString().slice(0, 10),
  }));

  const { system, user } = buildReflectionPrompt(period, promptEntries);
  const result = await generateStructured(system, user, reflectionSchema, 1000);

  return { result, entryCount: entries.length };
}

export async function dailyReflection(userId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return reflect("day", userId, start, end);
}

export async function weeklySummary(userId: string, weekStart: Date) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return reflect("week", userId, start, end);
}

export async function monthlySummary(userId: string, year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return reflect("month", userId, start, end);
}
