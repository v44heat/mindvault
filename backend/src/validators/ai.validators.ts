import { z } from "zod";

export const dailyReflectionSchema = z.object({
  date: z.coerce.date().optional(), // defaults to today
});

export const weeklySummarySchema = z.object({
  weekStart: z.coerce.date().optional(), // defaults to the start of this week
});

export const monthlySummarySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000),
  conversationId: z.string().optional(),
});
