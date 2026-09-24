import { Goal, IGoal } from "@models/Goal.model";
import { AppError } from "@utils/asyncHandler";
import { z } from "zod";
import { createGoalSchema, updateGoalSchema, addMilestoneSchema } from "@validators/goal.validators";
import { findEntriesRelatedToText } from "@services/ai/semanticSearch.service";

type CreateInput = z.infer<typeof createGoalSchema>;
type UpdateInput = z.infer<typeof updateGoalSchema>;
type MilestoneInput = z.infer<typeof addMilestoneSchema>;

export async function createGoal(userId: string, input: CreateInput): Promise<IGoal> {
  return Goal.create({ ...input, userId, startDate: input.startDate ?? new Date() });
}

export async function listGoals(userId: string, status?: string): Promise<IGoal[]> {
  const filter: Record<string, unknown> = { userId };
  if (status) filter.status = status;
  return Goal.find(filter).sort({ createdAt: -1 });
}

async function findOwnedGoalOrThrow(id: string, userId: string): Promise<IGoal> {
  const goal = await Goal.findOne({ _id: id, userId });
  if (!goal) {
    throw new AppError("Goal not found", 404, "GOAL_NOT_FOUND");
  }
  return goal;
}

export async function getGoal(id: string, userId: string): Promise<IGoal> {
  return findOwnedGoalOrThrow(id, userId);
}

export async function updateGoal(id: string, userId: string, input: UpdateInput): Promise<IGoal> {
  const goal = await findOwnedGoalOrThrow(id, userId);
  Object.assign(goal, input);
  await goal.save();
  return goal;
}

export async function deleteGoal(id: string, userId: string): Promise<void> {
  const goal = await findOwnedGoalOrThrow(id, userId);
  await goal.deleteOne();
}

function recomputeProgressFromMilestones(goal: IGoal): void {
  if (goal.milestones.length === 0) return;
  const completed = goal.milestones.filter((m) => m.completed).length;
  goal.progress = Math.round((completed / goal.milestones.length) * 100);
}

export async function addMilestone(id: string, userId: string, input: MilestoneInput): Promise<IGoal> {
  const goal = await findOwnedGoalOrThrow(id, userId);
  goal.milestones.push({ ...input, completed: false } as any);
  recomputeProgressFromMilestones(goal);
  await goal.save();
  return goal;
}

export async function toggleMilestone(id: string, milestoneId: string, userId: string): Promise<IGoal> {
  const goal = await findOwnedGoalOrThrow(id, userId);
  const milestone = goal.milestones.id(milestoneId);
  if (!milestone) {
    throw new AppError("Milestone not found", 404, "MILESTONE_NOT_FOUND");
  }
  milestone.completed = !milestone.completed;
  recomputeProgressFromMilestones(goal);
  await goal.save();
  return goal;
}

/**
 * Finds journal entries semantically related to a goal (spec section 26).
 * Uses the same embeddings-based search built for Phase 4 rather than a
 * separate mechanism - the goal's title+description simply becomes the query.
 */
export async function getRelatedEntries(id: string, userId: string) {
  const goal = await findOwnedGoalOrThrow(id, userId);
  return findEntriesRelatedToText(userId, `${goal.title}\n${goal.description}`);
}
