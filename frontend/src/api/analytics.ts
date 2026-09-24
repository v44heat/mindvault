import { api } from "./client";

export type AnalyticsRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";

export interface MoodAnalytics {
  entryCount: number;
  moodOverTime: { date: string; mood: string }[];
  moodDistribution: { mood: string; count: number }[];
  topTags: { tag: string; count: number }[];
  entryTypes: { type: string; count: number }[];
  range: AnalyticsRange;
}

export interface ActivityAnalytics {
  activityByDay: { day: string; count: number }[];
  activityByHour: { hour: number; count: number }[];
  entriesOverTime: { date: string; count: number; words: number }[];
  range: AnalyticsRange;
}

export async function getMoodAnalytics(range: AnalyticsRange): Promise<MoodAnalytics> {
  const { data } = await api.get("/analytics/mood", { params: { range } });
  return data.data;
}

export async function getActivityAnalytics(range: AnalyticsRange): Promise<ActivityAnalytics> {
  const { data } = await api.get("/analytics/activity", { params: { range } });
  return data.data;
}
