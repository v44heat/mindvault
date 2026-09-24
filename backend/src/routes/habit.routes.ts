import { Router } from "express";
import { requireAuth } from "@middleware/auth.middleware";
import { createHabit, listHabits, updateHabit, archiveHabit, deleteHabit, checkIn } from "@controllers/habit.controller";

const router = Router();
router.use(requireAuth);

router.get("/", listHabits);
router.post("/", createHabit);
router.put("/:id", updateHabit);
router.patch("/:id/archive", archiveHabit);
router.delete("/:id", deleteHabit);
router.post("/:id/check-in", checkIn);

export default router;
