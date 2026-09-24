import mongoose from "mongoose";
import { JournalEntry } from "@models/JournalEntry.model";

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Computes current + longest writing streak from actual entry dates. */
async function computeStreaks(userId: string) {
  const entries = await JournalEntry.find({ userId, isDeleted: false })
    .select("entryDate")
    .sort({ entryDate: -1 })
    .lean();

  const uniqueDays = Array.from(new Set(entries.map((e) => toDayKey(new Date(e.entryDate))))).sort(
    (a, b) => (a < b ? 1 : -1) // descending
  );

  if (uniqueDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const today = toDayKey(new Date());
  const yesterday = toDayKey(new Date(Date.now() - oneDayMs));

  let currentStreak = 0;
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]).getTime();
      const cur = new Date(uniqueDays[i]).getTime();
      if (prev - cur === oneDayMs) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  let longestStreak = 1;
  let running = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]).getTime();
    const cur = new Date(uniqueDays[i]).getTime();
    if (prev - cur === oneDayMs) {
      running++;
    } else {
      running = 1;
    }
    longestStreak = Math.max(longestStreak, running);
  }

  return { currentStreak, longestStreak };
}

export async function getDashboardOverview(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalEntries, entriesThisMonth, streaks, pinnedEntries, recentEntries, wordCountAgg] =
    await Promise.all([
      JournalEntry.countDocuments({ userId, isDeleted: false }),
      JournalEntry.countDocuments({ userId, isDeleted: false, entryDate: { $gte: startOfMonth } }),
      computeStreaks(userId),
      JournalEntry.find({ userId, isDeleted: false, isPinned: true })
        .sort({ entryDate: -1 })
        .limit(5),
      JournalEntry.find({ userId, isDeleted: false, isArchived: false })
        .sort({ entryDate: -1 })
        .limit(5),
      JournalEntry.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
        { $group: { _id: null, totalWords: { $sum: "$wordCount" } } },
      ]),
    ]);

  return {
    totalEntries,
    entriesThisMonth,
    totalWords: wordCountAgg[0]?.totalWords ?? 0,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    pinnedEntries,
    recentEntries,
  };
}

export type AnalyticsRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";

export function rangeToStartDate(range: AnalyticsRange): Date | null {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "3m":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "6m":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "1y":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case "all":
    default:
      return null;
  }
}

/** Mood trend over time + mood distribution + most-used tags + entry type breakdown. */
export async function getMoodAndContentAnalytics(userId: string, range: AnalyticsRange) {
  const start = rangeToStartDate(range);
  const match: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId), isDeleted: false };
  if (start) match.entryDate = { $gte: start };

  const [entries, moodOverTime, moodDistribution, tagCounts, typeCounts] = await Promise.all([
    JournalEntry.countDocuments(match),
    JournalEntry.aggregate([
      { $match: { ...match, mood: { $exists: true } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$entryDate" } },
          mood: { $first: "$mood" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    JournalEntry.aggregate([
      { $match: { ...match, mood: { $exists: true } } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
    ]),
    JournalEntry.aggregate([
      { $match: match },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    JournalEntry.aggregate([{ $match: match }, { $group: { _id: "$entryType", count: { $sum: 1 } } }]),
  ]);

  return {
    entryCount: entries,
    moodOverTime: moodOverTime.map((m) => ({ date: m._id, mood: m.mood })),
    moodDistribution: moodDistribution.map((m) => ({ mood: m._id, count: m.count })),
    topTags: tagCounts.map((t) => ({ tag: t._id, count: t.count })),
    entryTypes: typeCounts.map((t) => ({ type: t._id, count: t.count })),
  };
}

/** Writing activity by day-of-week and hour-of-day, plus entries-per-day for a trend line. */
export async function getActivityAnalytics(userId: string, range: AnalyticsRange) {
  const start = rangeToStartDate(range);
  const match: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId), isDeleted: false };
  if (start) match.entryDate = { $gte: start };

  const [byDayOfWeek, byHour, entriesOverTime] = await Promise.all([
    JournalEntry.aggregate([
      { $match: match },
      { $group: { _id: { $dayOfWeek: "$entryDate" }, count: { $sum: 1 } } }, // 1=Sunday
    ]),
    JournalEntry.aggregate([
      { $match: match },
      { $group: { _id: { $hour: "$entryDate" }, count: { $sum: 1 } } },
    ]),
    JournalEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$entryDate" } },
          count: { $sum: 1 },
          words: { $sum: "$wordCount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activityByDay = dayLabels.map((label, i) => ({
    day: label,
    count: byDayOfWeek.find((d) => d._id === i + 1)?.count ?? 0,
  }));

  const activityByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: byHour.find((h) => h._id === hour)?.count ?? 0,
  }));

  return {
    activityByDay,
    activityByHour,
    entriesOverTime: entriesOverTime.map((e) => ({ date: e._id, count: e.count, words: e.words })),
  };
}
