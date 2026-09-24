import { HydratedDocument } from "mongoose";
import { JournalEntry, IJournalEntry } from "@models/JournalEntry.model";
import { embedText, findSimilarEntryIds } from "./embeddings.service";

const DEFAULT_LIMIT = 10;

export async function semanticSearch(userId: string, query: string, limit = DEFAULT_LIMIT): Promise<HydratedDocument<IJournalEntry>[]> {
  const queryVector = await embedText(query);
  const matches = await findSimilarEntryIds(userId, queryVector, limit);

  if (matches.length === 0) return [];

  const entries = await JournalEntry.find({
    _id: { $in: matches.map((m) => m.entryId) },
    userId,
    isDeleted: false,
  });

  // Preserve similarity ranking - the $in query above doesn't guarantee order.
  const byId = new Map(entries.map((e) => [e._id.toString(), e]));
  return matches.map((m) => byId.get(m.entryId)).filter((e): e is HydratedDocument<IJournalEntry> => Boolean(e));
}

export async function relatedEntries(entryId: string, userId: string, limit = 5): Promise<HydratedDocument<IJournalEntry>[]> {
  const entry = await JournalEntry.findOne({ _id: entryId, userId, isDeleted: false });
  if (!entry || !entry.contentText.trim()) return [];

  const queryVector = await embedText(`${entry.title}\n${entry.contentText}`);
  const matches = await findSimilarEntryIds(userId, queryVector, limit, entryId);
  if (matches.length === 0) return [];

  const entries = await JournalEntry.find({
    _id: { $in: matches.map((m) => m.entryId) },
    userId,
    isDeleted: false,
  });

  const byId = new Map(entries.map((e) => [e._id.toString(), e]));
  return matches.map((m) => byId.get(m.entryId)).filter((e): e is HydratedDocument<IJournalEntry> => Boolean(e));
}

/** Finds entries whose related-text (title/description) is used as the semantic query - used by Goals. */
export async function findEntriesRelatedToText(userId: string, text: string, limit = 6): Promise<HydratedDocument<IJournalEntry>[]> {
  return semanticSearch(userId, text, limit);
}
