import { api } from "./client";
import type { JournalEntry } from "../types";

export interface Milestone {
  _id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Goal {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  targetDate?: string;
  progress: number;
  status: "active" | "completed" | "abandoned";
  milestones: Milestone[];
}

export async function listGoals(status?: string): Promise<Goal[]> {
  const { data } = await api.get("/goals", { params: status ? { status } : {} });
  return data.data.goals;
}

export async function createGoal(input: { title: string; description?: string; targetDate?: string }): Promise<Goal> {
  const { data } = await api.post("/goals", input);
  return data.data.goal;
}

export async function updateGoal(id: string, input: Partial<Pick<Goal, "title" | "description" | "progress" | "status" | "targetDate">>): Promise<Goal> {
  const { data } = await api.put(`/goals/${id}`, input);
  return data.data.goal;
}

export async function deleteGoal(id: string): Promise<void> {
  await api.delete(`/goals/${id}`);
}

export async function addMilestone(id: string, title: string, dueDate?: string): Promise<Goal> {
  const { data } = await api.post(`/goals/${id}/milestones`, { title, dueDate });
  return data.data.goal;
}

export async function toggleMilestone(id: string, milestoneId: string): Promise<Goal> {
  const { data } = await api.patch(`/goals/${id}/milestones/${milestoneId}/toggle`);
  return data.data.goal;
}

export async function getRelatedEntries(id: string): Promise<JournalEntry[]> {
  const { data } = await api.get(`/goals/${id}/related-entries`);
  return data.data.entries;
}
