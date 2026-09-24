import { api } from "./client";
import type { JournalEntry, Paginated, DashboardOverview } from "../types";

export interface EntryInput {
  title?: string;
  content?: string;
  entryType?: string;
  mood?: string;
  emotions?: string[];
  tags?: string[];
  location?: string;
  weather?: string;
  privacy?: "private" | "shared";
  entryDate?: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  tag?: string;
  mood?: string;
  entryType?: string;
  pinned?: boolean;
  archived?: boolean;
  q?: string;
}

export async function listEntries(params: ListParams = {}): Promise<Paginated<JournalEntry>> {
  const { data } = await api.get("/journal", { params });
  return data.data;
}

export async function getEntry(id: string): Promise<JournalEntry> {
  const { data } = await api.get(`/journal/${id}`);
  return data.data.entry;
}

export async function createEntry(input: EntryInput): Promise<JournalEntry> {
  const { data } = await api.post("/journal", input);
  return data.data.entry;
}

export async function updateEntry(id: string, input: EntryInput): Promise<JournalEntry> {
  const { data } = await api.put(`/journal/${id}`, input);
  return data.data.entry;
}

export async function deleteEntry(id: string): Promise<void> {
  await api.delete(`/journal/${id}`);
}

export async function setPinned(id: string, pinned: boolean): Promise<JournalEntry> {
  const { data } = await api.patch(`/journal/${id}/pin`, { pinned });
  return data.data.entry;
}

export async function setArchived(id: string, archived: boolean): Promise<JournalEntry> {
  const { data } = await api.patch(`/journal/${id}/archive`, { archived });
  return data.data.entry;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const { data } = await api.get("/analytics/overview");
  return data.data;
}

export interface CalendarDay {
  count: number;
  moods: string[];
  entryIds: string[];
}

export async function getCalendarMonth(year: number, month: number): Promise<{ year: number; month: number; days: Record<string, CalendarDay> }> {
  const { data } = await api.get("/journal/calendar", { params: { year, month } });
  return data.data;
}

export interface TimelineEntry {
  _id: string;
  title: string;
  entryDate: string;
  mood?: string;
  entryType: string;
  tags: string[];
  isImportantMemory: boolean;
}

export async function getTimeline(): Promise<{ entries: TimelineEntry[] }> {
  const { data } = await api.get("/journal/timeline");
  return data.data;
}

export async function listTrash(): Promise<{ entries: JournalEntry[] }> {
  const { data } = await api.get("/journal/trash");
  return data.data;
}

export async function restoreEntry(id: string): Promise<JournalEntry> {
  const { data } = await api.patch(`/journal/${id}/restore`);
  return data.data.entry;
}

export async function permanentlyDeleteEntry(id: string): Promise<void> {
  await api.delete(`/journal/${id}/permanent`);
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post("/uploads/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function getOnThisDay(): Promise<{ entries: JournalEntry[] }> {
  const { data } = await api.get("/journal/on-this-day");
  return data.data;
}
