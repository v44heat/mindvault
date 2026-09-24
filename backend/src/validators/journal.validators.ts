import { z } from "zod";
import { ENTRY_TYPES, MOODS } from "@models/JournalEntry.model";

export const attachmentSchema = z.object({
  type: z.enum(["image", "audio"]),
  url: z.string().url(),
  publicId: z.string().optional(),
  duration: z.number().optional(),
  caption: z.string().max(300).optional(),
});

export const createEntrySchema = z.object({
  title: z.string().trim().max(300).optional().default(""),
  content: z.string().max(200_000).optional().default(""),
  entryType: z.enum(ENTRY_TYPES).optional().default("daily"),
  mood: z.enum(MOODS).optional(),
  emotions: z.array(z.string().trim().max(50)).max(20).optional().default([]),
  tags: z.array(z.string().trim().max(50)).max(30).optional().default([]),
  attachments: z.array(attachmentSchema).max(20).optional().default([]),
  location: z.string().trim().max(200).optional(),
  weather: z.string().trim().max(100).optional(),
  privacy: z.enum(["private", "shared"]).optional().default("private"),
  entryDate: z.coerce.date().optional(),
});

export const updateEntrySchema = createEntrySchema.partial();

export const listEntriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  tag: z.string().optional(),
  mood: z.enum(MOODS).optional(),
  entryType: z.enum(ENTRY_TYPES).optional(),
  pinned: z.coerce.boolean().optional(),
  archived: z.coerce.boolean().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().optional(),
});
