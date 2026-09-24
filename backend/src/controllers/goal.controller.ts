import { asyncHandler, AppError } from "@utils/asyncHandler";
import { AuthenticatedRequest } from "@middleware/auth.middleware";
import * as goalService from "@services/goal.service";
import { createGoalSchema, updateGoalSchema, addMilestoneSchema } from "@validators/goal.validators";

export const createGoal = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = createGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const goal = await goalService.createGoal(req.userId!, parsed.data);
  res.status(201).json({ success: true, data: { goal } });
});

export const listGoals = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const goals = await goalService.listGoals(req.userId!, status);
  res.status(200).json({ success: true, data: { goals } });
});

export const getGoal = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const goal = await goalService.getGoal(req.params.id, req.userId!);
  res.status(200).json({ success: true, data: { goal } });
});

export const updateGoal = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = updateGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const goal = await goalService.updateGoal(req.params.id, req.userId!, parsed.data);
  res.status(200).json({ success: true, data: { goal } });
});

export const deleteGoal = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await goalService.deleteGoal(req.params.id, req.userId!);
  res.status(200).json({ success: true, message: "Goal deleted" });
});

export const addMilestone = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = addMilestoneSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((i) => i.message).join("; "), 400, "VALIDATION_ERROR");
  }
  const goal = await goalService.addMilestone(req.params.id, req.userId!, parsed.data);
  res.status(200).json({ success: true, data: { goal } });
});

export const toggleMilestone = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const goal = await goalService.toggleMilestone(req.params.id, req.params.milestoneId, req.userId!);
  res.status(200).json({ success: true, data: { goal } });
});

export const getRelatedEntries = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const entries = await goalService.getRelatedEntries(req.params.id, req.userId!);
  res.status(200).json({ success: true, data: { entries } });
});
