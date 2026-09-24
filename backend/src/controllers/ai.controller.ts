import { asyncHandler, AppError } from "@utils/asyncHandler";
import { AuthenticatedRequest } from "@middleware/auth.middleware";
import * as summarization from "@services/ai/summarization.service";
import * as insights from "@services/ai/insight.service";
import * as chatService from "@services/ai/chat.service";
import * as semanticSearchService from "@services/ai/semanticSearch.service";
import { dailyReflectionSchema, weeklySummarySchema, monthlySummarySchema, chatSchema } from "@validators/ai.validators";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const analyzeEntry = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const entry = await summarization.analyzeEntry(req.params.entryId, req.userId!);
  res.status(200).json({ success: true, data: { entry } });
});

export const dailyReflection = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = dailyReflectionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const date = parsed.data.date ?? new Date();
  const { result, entryCount } = await summarization.dailyReflection(req.userId!, date);
  res.status(200).json({ success: true, data: { reflection: result, entryCount } });
});

export const weeklySummary = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = weeklySummarySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const weekStart = parsed.data.weekStart ?? startOfWeek(new Date());
  const { result, entryCount } = await summarization.weeklySummary(req.userId!, weekStart);
  res.status(200).json({ success: true, data: { summary: result, entryCount } });
});

export const monthlySummary = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = monthlySummarySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const now = new Date();
  const year = parsed.data.year ?? now.getFullYear();
  const month = parsed.data.month ?? now.getMonth() + 1;
  const { result, entryCount } = await summarization.monthlySummary(req.userId!, year, month);
  res.status(200).json({ success: true, data: { summary: result, entryCount } });
});

export const chat = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const result = await chatService.chat(req.userId!, parsed.data.message, parsed.data.conversationId);
  res.status(200).json({ success: true, data: result });
});

export const listConversations = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const conversations = await chatService.listConversations(req.userId!);
  res.status(200).json({ success: true, data: { conversations } });
});

export const getConversation = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const conversation = await chatService.getConversation(req.params.id, req.userId!);
  res.status(200).json({ success: true, data: { conversation } });
});

export const generateInsights = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const created = await insights.generateInsights(req.userId!);
  res.status(201).json({ success: true, data: { insights: created } });
});

export const listInsights = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const includeDismissed = req.query.includeDismissed === "true";
  const list = await insights.listInsights(req.userId!, includeDismissed);
  res.status(200).json({ success: true, data: { insights: list } });
});

export const dismissInsight = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const insight = await insights.dismissInsight(req.params.id, req.userId!);
  res.status(200).json({ success: true, data: { insight } });
});

export const saveInsight = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const insight = await insights.saveInsight(req.params.id, req.userId!);
  res.status(200).json({ success: true, data: { insight } });
});

export const semanticSearch = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    throw new AppError("q query param is required", 400, "VALIDATION_ERROR");
  }
  const entries = await semanticSearchService.semanticSearch(req.userId!, q);
  res.status(200).json({ success: true, data: { entries } });
});

export const relatedEntries = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const entries = await semanticSearchService.relatedEntries(req.params.entryId, req.userId!);
  res.status(200).json({ success: true, data: { entries } });
});
