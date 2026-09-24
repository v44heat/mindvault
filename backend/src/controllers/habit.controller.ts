import { asyncHandler, AppError } from "@utils/asyncHandler";
import { AuthenticatedRequest } from "@middleware/auth.middleware";
import * as habitService from "@services/habit.service";
import { createHabitSchema, updateHabitSchema, checkInSchema } from "@validators/habit.validators";

export const createHabit = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = createHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const habit = await habitService.createHabit(req.userId!, parsed.data);
  res.status(201).json({ success: true, data: { habit, stats: habitService.computeHabitStats(habit) } });
});

export const listHabits = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const habits = await habitService.listHabits(req.userId!);
  const withStats = habits.map((h) => ({ habit: h, stats: habitService.computeHabitStats(h) }));
  res.status(200).json({ success: true, data: { habits: withStats } });
});

export const updateHabit = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = updateHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const habit = await habitService.updateHabit(req.params.id, req.userId!, parsed.data);
  res.status(200).json({ success: true, data: { habit, stats: habitService.computeHabitStats(habit) } });
});

export const archiveHabit = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const habit = await habitService.archiveHabit(req.params.id, req.userId!);
  res.status(200).json({ success: true, data: { habit } });
});

export const deleteHabit = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await habitService.deleteHabit(req.params.id, req.userId!);
  res.status(200).json({ success: true, message: "Habit deleted" });
});

export const checkIn = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const habit = await habitService.toggleCheckIn(req.params.id, req.userId!, parsed.data.date);
  res.status(200).json({ success: true, data: { habit, stats: habitService.computeHabitStats(habit) } });
});
