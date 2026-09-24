import { Router } from "express";
import { requireAuth } from "@middleware/auth.middleware";
import {
  createGoal,
  listGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  addMilestone,
  toggleMilestone,
  getRelatedEntries,
} from "@controllers/goal.controller";

const router = Router();
router.use(requireAuth);

router.get("/", listGoals);
router.post("/", createGoal);
router.get("/:id", getGoal);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);
router.post("/:id/milestones", addMilestone);
router.patch("/:id/milestones/:milestoneId/toggle", toggleMilestone);
router.get("/:id/related-entries", getRelatedEntries);

export default router;
