import { api } from "./client";

export interface Habit {
  _id: string;
  name: string;
  icon: string;
  frequency: "daily" | "weekly";
  checkIns: string[];
  isArchived: boolean;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  last7Days: number;
  last30DaysRate: number;
}

export interface HabitWithStats {
  habit: Habit;
  stats: HabitStats;
}

export async function listHabits(): Promise<HabitWithStats[]> {
  const { data } = await api.get("/habits");
  return data.data.habits;
}

export async function createHabit(input: { name: string; icon?: string; frequency?: "daily" | "weekly" }): Promise<HabitWithStats> {
  const { data } = await api.post("/habits", input);
  return data.data;
}

export async function archiveHabit(id: string): Promise<Habit> {
  const { data } = await api.patch(`/habits/${id}/archive`);
  return data.data.habit;
}

export async function deleteHabit(id: string): Promise<void> {
  await api.delete(`/habits/${id}`);
}

export async function checkInHabit(id: string, date?: string): Promise<HabitWithStats> {
  const { data } = await api.post(`/habits/${id}/check-in`, date ? { date } : {});
  return data.data;
}
