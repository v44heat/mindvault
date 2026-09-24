import { Schema, model, Document, Types } from "mongoose";

export const ENTRY_TYPES = [
  "daily",
  "quick_note",
  "gratitude",
  "reflection",
  "idea",
  "achievement",
  "memory",
  "dream",
  "goal_reflection",
  "voice",
] as const;

export const MOODS = [
  "excellent",
  "good",
  "neutral",
  "low",
  "very_low",
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];
export type Mood = (typeof MOODS)[number];

interface IAttachment {
  type: "image" | "audio";
  url: string;
  publicId?: string;
  duration?: number; // for audio, in seconds
  caption?: string;
}

interface IAiAnalysis {
  summary?: string;
  themes?: string[];
  emotions?: string[];
  keyEvents?: string[];
  positiveMoments?: string[];
  challenges?: string[];
  actionItems?: string[];
  reflectionQuestions?: string[];
  analyzedAt?: Date;
}

export interface IJournalEntry extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  content: string; // rich text HTML/JSON from editor
  contentText: string; // plain text extraction, used for search/AI
  entryType: EntryType;
  mood?: Mood;
  emotions: string[];
  tags: string[];
  attachments: IAttachment[];
  location?: string;
  weather?: string;
  privacy: "private" | "shared";
  aiAnalysis?: IAiAnalysis;
  wordCount: number;
  readingTime: number; // minutes
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  isImportantMemory: boolean;
  entryDate: Date; // the date the entry logically belongs to
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    type: { type: String, enum: ["image", "audio"], required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    duration: { type: Number },
    caption: { type: String },
  },
  { _id: false }
);

const aiAnalysisSchema = new Schema<IAiAnalysis>(
  {
    summary: String,
    themes: [String],
    emotions: [String],
    keyEvents: [String],
    positiveMoments: [String],
    challenges: [String],
    actionItems: [String],
    reflectionQuestions: [String],
    analyzedAt: Date,
  },
  { _id: false }
);

const journalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, maxlength: 300, default: "" },
    content: { type: String, default: "" },
    contentText: { type: String, default: "" },
    entryType: { type: String, enum: ENTRY_TYPES, default: "daily" },
    mood: { type: String, enum: MOODS },
    emotions: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    attachments: { type: [attachmentSchema], default: [] },
    location: { type: String },
    weather: { type: String },
    privacy: { type: String, enum: ["private", "shared"], default: "private" },
    aiAnalysis: { type: aiAnalysisSchema },
    wordCount: { type: Number, default: 0 },
    readingTime: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    isImportantMemory: { type: Boolean, default: false },
    entryDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Indexes designed around real query patterns (see spec section 38)
journalEntrySchema.index({ userId: 1, createdAt: -1 });
journalEntrySchema.index({ userId: 1, entryDate: -1 });
journalEntrySchema.index({ userId: 1, isPinned: 1 });
journalEntrySchema.index({ userId: 1, mood: 1 });
journalEntrySchema.index({ userId: 1, entryType: 1 });
journalEntrySchema.index({ userId: 1, isArchived: 1, isDeleted: 1 });
journalEntrySchema.index({ userId: 1, tags: 1 });
journalEntrySchema.index({ title: "text", contentText: "text" });

export const JournalEntry = model<IJournalEntry>("JournalEntry", journalEntrySchema);
