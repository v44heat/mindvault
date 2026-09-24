export type Mood = "excellent" | "good" | "neutral" | "low" | "very_low";

export type EntryType =
  | "daily"
  | "quick_note"
  | "gratitude"
  | "reflection"
  | "idea"
  | "achievement"
  | "memory"
  | "dream"
  | "goal_reflection"
  | "voice";

export interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  timezone: string;
  onboardingCompleted: boolean;
  preferences: {
    theme: "light" | "dark" | "system";
    defaultEntryPrivacy: "private" | "shared";
    aiAnalysisEnabled: boolean;
    moodTrackingEnabled: boolean;
    streakTrackingEnabled: boolean;
    weeklySummaryEmails: boolean;
  };
}

export interface Attachment {
  type: "image" | "audio";
  url: string;
  duration?: number;
  caption?: string;
}

export interface AiAnalysis {
  summary?: string;
  themes?: string[];
  emotions?: string[];
  keyEvents?: string[];
  positiveMoments?: string[];
  challenges?: string[];
  actionItems?: string[];
  reflectionQuestions?: string[];
  analyzedAt?: string;
}

export interface JournalEntry {
  _id: string;
  userId: string;
  title: string;
  content: string;
  contentText: string;
  entryType: EntryType;
  mood?: Mood;
  emotions: string[];
  tags: string[];
  attachments: Attachment[];
  location?: string;
  weather?: string;
  privacy: "private" | "shared";
  aiAnalysis?: AiAnalysis;
  wordCount: number;
  readingTime: number;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  isImportantMemory: boolean;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  entries: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardOverview {
  totalEntries: number;
  entriesThisMonth: number;
  totalWords: number;
  currentStreak: number;
  longestStreak: number;
  pinnedEntries: JournalEntry[];
  recentEntries: JournalEntry[];
}

export interface ApiError {
  success: false;
  message: string;
  errorCode: string;
}
