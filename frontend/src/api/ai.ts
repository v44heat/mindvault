import { api } from "./client";
import type { JournalEntry } from "../types";

export interface ReflectionResult {
  summary: string;
  majorEvents: string[];
  mostDiscussedTopics: string[];
  moodOverview: string;
  achievements: string[];
  challenges: string[];
  lessons: string[];
  reflectionQuestions: string[];
}

export async function analyzeEntry(entryId: string): Promise<JournalEntry> {
  const { data } = await api.post(`/ai/analyze/${entryId}`);
  return data.data.entry;
}

export async function dailyReflection(date?: string): Promise<{ reflection: ReflectionResult; entryCount: number }> {
  const { data } = await api.post("/ai/daily-reflection", date ? { date } : {});
  return data.data;
}

export async function weeklySummary(weekStart?: string): Promise<{ summary: ReflectionResult; entryCount: number }> {
  const { data } = await api.post("/ai/weekly-summary", weekStart ? { weekStart } : {});
  return data.data;
}

export async function monthlySummary(year?: number, month?: number): Promise<{ summary: ReflectionResult; entryCount: number }> {
  const { data } = await api.post("/ai/monthly-summary", { year, month });
  return data.data;
}

export interface ChatSource {
  id: string;
  title: string;
}

export interface ChatResponse {
  conversationId: string;
  answer: string;
  sources: ChatSource[];
}

export async function chat(message: string, conversationId?: string): Promise<ChatResponse> {
  const { data } = await api.post("/ai/chat", { message, conversationId });
  return data.data;
}

export interface AiInsight {
  _id: string;
  insight: string;
  confidence: "low" | "medium" | "high";
  isDismissed: boolean;
  isSaved: boolean;
  discoveredAt: string;
  supportingEntryIds: { _id: string; title: string; entryDate: string }[];
}

export async function generateInsights(): Promise<AiInsight[]> {
  const { data } = await api.post("/ai/generate-insights");
  return data.data.insights;
}

export async function listInsights(): Promise<AiInsight[]> {
  const { data } = await api.get("/ai/insights");
  return data.data.insights;
}

export async function dismissInsight(id: string): Promise<AiInsight> {
  const { data } = await api.patch(`/ai/insights/${id}/dismiss`);
  return data.data.insight;
}

export async function saveInsight(id: string): Promise<AiInsight> {
  const { data } = await api.patch(`/ai/insights/${id}/save`);
  return data.data.insight;
}

export async function semanticSearch(q: string): Promise<JournalEntry[]> {
  const { data } = await api.get("/ai/search", { params: { q } });
  return data.data.entries;
}

export async function relatedEntries(entryId: string): Promise<JournalEntry[]> {
  const { data } = await api.get(`/ai/related/${entryId}`);
  return data.data.entries;
}
