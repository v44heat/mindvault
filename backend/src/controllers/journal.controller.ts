import { asyncHandler, AppError } from "@utils/asyncHandler";
import { AuthenticatedRequest } from "@middleware/auth.middleware";
import * as journalService from "@services/journal.service";
import {
  createEntrySchema,
  updateEntrySchema,
  listEntriesQuerySchema,
} from "@validators/journal.validators";

export const createEntry = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = createEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const entry = await journalService.createEntry(req.userId!, parsed.data);
  res.status(201).json({ success: true, data: { entry } });
});

export const listEntries = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = listEntriesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const result = await journalService.listEntries(req.userId!, parsed.data);
  res.status(200).json({ success: true, data: result });
});

export const getEntry = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const entry = await journalService.getEntry(req.params.id, req.userId!);
  res.status(200).json({ success: true, data: { entry } });
});

export const updateEntry = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = updateEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const entry = await journalService.updateEntry(req.params.id, req.userId!, parsed.data);
  res.status(200).json({ success: true, data: { entry } });
});

export const deleteEntry = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await journalService.deleteEntry(req.params.id, req.userId!);
  res.status(200).json({ success: true, message: "Entry moved to trash" });
});

export const archiveEntry = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const archived = req.body?.archived !== false;
  const entry = await journalService.setArchived(req.params.id, req.userId!, archived);
  res.status(200).json({ success: true, data: { entry } });
});

export const pinEntry = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const pinned = req.body?.pinned !== false;
  const entry = await journalService.setPinned(req.params.id, req.userId!, pinned);
  res.status(200).json({ success: true, data: { entry } });
});

export const listTrash = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await journalService.listTrash(req.userId!);
  res.status(200).json({ success: true, data: result });
});

export const restoreEntry = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const entry = await journalService.restoreEntry(req.params.id, req.userId!);
  res.status(200).json({ success: true, data: { entry } });
});

export const permanentlyDeleteEntry = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await journalService.permanentlyDeleteEntry(req.params.id, req.userId!);
  res.status(200).json({ success: true, message: "Entry permanently deleted" });
});

export const getCalendarMonth = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const year = parseInt(String(req.query.year), 10);
  const month = parseInt(String(req.query.month), 10);
  if (!year || !month || month < 1 || month > 12) {
    throw new AppError("year and month query params are required", 400, "VALIDATION_ERROR");
  }
  const result = await journalService.getCalendarMonth(req.userId!, year, month);
  res.status(200).json({ success: true, data: result });
});

export const getTimeline = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await journalService.getTimeline(req.userId!);
  res.status(200).json({ success: true, data: result });
});

export const getOnThisDay = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await journalService.getOnThisDay(req.userId!, new Date());
  res.status(200).json({ success: true, data: result });
});

