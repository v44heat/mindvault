import { Habit, IHabit } from "@models/Habit.model";
import { AppError } from "@utils/asyncHandler";
import { z } from "zod";
import { createHabitSchema, updateHabitSchema } from "@validators/habit.validators";

type CreateInput = z.infer<typeof createHabitSchema>;
type UpdateInput = z.infer<typeof updateHabitSchema>;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createHabit(userId: string, input: CreateInput): Promise<IHabit> {
  return Habit.create({ ...input, userId });
}

export async function listHabits(userId: string, includeArchived = false): Promise<IHabit[]> {
  const filter: Record<string, unknown> = { userId };
  if (!includeArchived) filter.isArchived = false;
  return Habit.find(filter).sort({ createdAt: 1 });
}

async function findOwnedHabitOrThrow(id: string, userId: string): Promise<IHabit> {
  const habit = await Habit.findOne({ _id: id, userId });
  if (!habit) {
    throw new AppError("Habit not found", 404, "HABIT_NOT_FOUND");
  }
  return habit;
}

export async function updateHabit(id: string, userId: string, input: UpdateInput): Promise<IHabit> {
  const habit = await findOwnedHabitOrThrow(id, userId);
  Object.assign(habit, input);
  await habit.save();
  return habit;
}

export async function archiveHabit(id: string, userId: string): Promise<IHabit> {
  const habit = await findOwnedHabitOrThrow(id, userId);
  habit.isArchived = true;
  await habit.save();
  return habit;
}

export async function deleteHabit(id: string, userId: string): Promise<void> {
  const habit = await findOwnedHabitOrThrow(id, userId);
  await habit.deleteOne();
}

export async function toggleCheckIn(id: string, userId: string, date?: string): Promise<IHabit> {
  const habit = await findOwnedHabitOrThrow(id, userId);
  const key = date ?? todayKey();

  const index = habit.checkIns.indexOf(key);
  if (index >= 0) {
    habit.checkIns.splice(index, 1);
  } else {
    habit.checkIns.push(key);
    habit.checkIns.sort();
  }

  await habit.save();
  return habit;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  last7Days: number;
  last30DaysRate: number; // 0-1
}

export function computeHabitStats(habit: IHabit): HabitStats {
  const days = [...new Set(habit.checkIns)].sort((a, b) => (a < b ? 1 : -1)); // descending
  if (days.length === 0) {
    return { currentStreak: 0, longestStreak: 0, last7Days: 0, last30DaysRate: 0 };
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const todayStr = todayKey();
  const yesterdayStr = new Date(Date.now() - oneDayMs).toISOString().slice(0, 10);

  let currentStreak = 0;
  if (days[0] === todayStr || days[0] === yesterdayStr) {
    currentStreak = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]).getTime();
      const cur = new Date(days[i]).getTime();
      if (prev - cur === oneDayMs) currentStreak++;
      else break;
    }
  }

  let longestStreak = 1;
  let running = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]).getTime();
    const cur = new Date(days[i]).getTime();
    if (prev - cur === oneDayMs) running++;
    else running = 1;
    longestStreak = Math.max(longestStreak, running);
  }

  const now = Date.now();
  const last7Days = days.filter((d) => now - new Date(d).getTime() <= 7 * oneDayMs).length;
  const last30Days = days.filter((d) => now - new Date(d).getTime() <= 30 * oneDayMs).length;

  return {
    currentStreak,
    longestStreak,
    last7Days,
    last30DaysRate: Math.min(1, last30Days / 30),
  };
}
