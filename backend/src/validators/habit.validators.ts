import { z } from "zod";

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  icon: z.string().max(10).optional().default("✅"),
  frequency: z.enum(["daily", "weekly"]).optional().default("daily"),
});

export const updateHabitSchema = createHabitSchema.partial();

export const checkInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be yyyy-mm-dd").optional(),
});
