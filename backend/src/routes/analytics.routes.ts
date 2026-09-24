import { Router } from "express";
import { requireAuth } from "@middleware/auth.middleware";
import { overview, mood, activity } from "@controllers/analytics.controller";

const router = Router();

router.use(requireAuth);
router.get("/overview", overview);
router.get("/mood", mood);
router.get("/activity", activity);

export default router;
