import { FilterQuery } from "mongoose";
import { JournalEntry, IJournalEntry } from "@models/JournalEntry.model";
import { htmlToPlainText, countWords, estimateReadingTimeMinutes } from "@utils/textStats";
import { AppError } from "@utils/asyncHandler";
import { z } from "zod";
import { createEntrySchema, updateEntrySchema, listEntriesQuerySchema } from "@validators/journal.validators";
import { indexEntry, removeEntryIndex } from "@services/ai/embeddings.service";

type CreateInput = z.infer<typeof createEntrySchema>;
type UpdateInput = z.infer<typeof updateEntrySchema>;
type ListQuery = z.infer<typeof listEntriesQuerySchema>;

function deriveTextFields(content: string) {
  const contentText = htmlToPlainText(content ?? "");
  const wordCount = countWords(contentText);
  const readingTime = estimateReadingTimeMinutes(wordCount);
  return { contentText, wordCount, readingTime };
}

export async function createEntry(userId: string, input: CreateInput): Promise<IJournalEntry> {
  const { contentText, wordCount, readingTime } = deriveTextFields(input.content ?? "");

  const entry = await JournalEntry.create({
    ...input,
    userId,
    contentText,
    wordCount,
    readingTime,
    entryDate: input.entryDate ?? new Date(),
  });

  // Best-effort: indexing failures (e.g. no OPENAI_API_KEY configured) must never
  // block a journal save. Semantic search simply won't find this entry yet.
  if (contentText.trim()) {
    void indexEntry(entry._id.toString(), userId, `${entry.title}\n${contentText}`);
  }

  return entry;
}

/** Every read/write is scoped to userId - never trust an id alone. */
async function findOwnedEntryOrThrow(id: string, userId: string): Promise<IJournalEntry> {
  const entry = await JournalEntry.findOne({ _id: id, userId, isDeleted: false });
  if (!entry) {
    throw new AppError("Journal entry not found", 404, "ENTRY_NOT_FOUND");
  }
  return entry;
}

export async function getEntry(id: string, userId: string): Promise<IJournalEntry> {
  return findOwnedEntryOrThrow(id, userId);
}

export async function updateEntry(id: string, userId: string, input: UpdateInput): Promise<IJournalEntry> {
  const entry = await findOwnedEntryOrThrow(id, userId);

  Object.assign(entry, input);

  if (input.content !== undefined) {
    const { contentText, wordCount, readingTime } = deriveTextFields(input.content);
    entry.contentText = contentText;
    entry.wordCount = wordCount;
    entry.readingTime = readingTime;
  }

  await entry.save();

  if (input.content !== undefined || input.title !== undefined) {
    if (entry.contentText.trim()) {
      void indexEntry(entry._id.toString(), userId, `${entry.title}\n${entry.contentText}`);
    }
  }

  return entry;
}

export async function deleteEntry(id: string, userId: string): Promise<void> {
  // Soft delete - moves to Trash rather than being destroyed immediately.
  const entry = await findOwnedEntryOrThrow(id, userId);
  entry.isDeleted = true;
  entry.deletedAt = new Date();
  await entry.save();
}

async function findOwnedTrashedEntryOrThrow(id: string, userId: string): Promise<IJournalEntry> {
  const entry = await JournalEntry.findOne({ _id: id, userId, isDeleted: true });
  if (!entry) {
    throw new AppError("Entry not found in trash", 404, "ENTRY_NOT_FOUND");
  }
  return entry;
}

export async function restoreEntry(id: string, userId: string): Promise<IJournalEntry> {
  const entry = await findOwnedTrashedEntryOrThrow(id, userId);
  entry.isDeleted = false;
  entry.deletedAt = undefined;
  await entry.save();
  return entry;
}

export async function permanentlyDeleteEntry(id: string, userId: string): Promise<void> {
  const entry = await findOwnedTrashedEntryOrThrow(id, userId);
  await entry.deleteOne();
  await removeEntryIndex(id);
}

export async function listTrash(userId: string) {
  const entries = await JournalEntry.find({ userId, isDeleted: true }).sort({ deletedAt: -1 });
  return { entries };
}

export async function setArchived(id: string, userId: string, archived: boolean): Promise<IJournalEntry> {
  const entry = await findOwnedEntryOrThrow(id, userId);
  entry.isArchived = archived;
  await entry.save();
  return entry;
}

export async function setPinned(id: string, userId: string, pinned: boolean): Promise<IJournalEntry> {
  const entry = await findOwnedEntryOrThrow(id, userId);
  entry.isPinned = pinned;
  await entry.save();
  return entry;
}

/** Per-day entry counts + moods for a given month, used to render the calendar heatmap. */
export async function getCalendarMonth(userId: string, year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const entries = await JournalEntry.find({
    userId,
    isDeleted: false,
    entryDate: { $gte: start, $lt: end },
  })
    .select("entryDate mood entryType title")
    .sort({ entryDate: 1 });

  const days: Record<string, { count: number; moods: string[]; entryIds: string[] }> = {};
  for (const entry of entries) {
    const key = entry.entryDate.toISOString().slice(0, 10);
    if (!days[key]) days[key] = { count: 0, moods: [], entryIds: [] };
    days[key].count += 1;
    if (entry.mood) days[key].moods.push(entry.mood);
    days[key].entryIds.push(entry._id.toString());
  }

  return { year, month, days };
}

/** Chronological list for the memory timeline - lightweight fields only. */
export async function getTimeline(userId: string) {
  const entries = await JournalEntry.find({ userId, isDeleted: false, isArchived: false })
    .select("title entryDate mood entryType tags isImportantMemory")
    .sort({ entryDate: -1 })
    .limit(500);
  return { entries };
}

/** Entries written on this same month/day in previous years (spec section 57). */
export async function getOnThisDay(userId: string, referenceDate: Date) {
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();
  const currentYear = referenceDate.getFullYear();

  // entryDate is a plain Date, so we scan the user's entries and filter in
  // application code rather than trying to express "same month/day, any year"
  // as a single Mongo query - this stays simple and is cheap at journal scale.
  const candidates = await JournalEntry.find({ userId, isDeleted: false })
    .select("title contentText entryDate mood entryType")
    .sort({ entryDate: -1 });

  const matches = candidates.filter((e) => {
    const d = e.entryDate;
    return d.getMonth() === month && d.getDate() === day && d.getFullYear() !== currentYear;
  });

  return { entries: matches };
}

export async function listEntries(userId: string, query: ListQuery) {
  const filter: FilterQuery<IJournalEntry> = {
    userId,
    isDeleted: false,
    isArchived: query.archived ?? false,
  };

  if (query.tag) filter.tags = query.tag;
  if (query.mood) filter.mood = query.mood;
  if (query.entryType) filter.entryType = query.entryType;
  if (query.pinned !== undefined) filter.isPinned = query.pinned;
  if (query.from || query.to) {
    filter.entryDate = {};
    if (query.from) filter.entryDate.$gte = query.from;
    if (query.to) filter.entryDate.$lte = query.to;
  }
  if (query.q) {
    filter.$text = { $search: query.q };
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    JournalEntry.find(filter)
      .sort({ entryDate: -1 })
      .skip(skip)
      .limit(limit),
    JournalEntry.countDocuments(filter),
  ]);

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
