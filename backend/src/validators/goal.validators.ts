import { z } from "zod";

export const createGoalSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().default(""),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  targetDate: z.coerce.date().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "completed", "abandoned"]).optional(),
});

export const addMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  dueDate: z.coerce.date().optional(),
});
