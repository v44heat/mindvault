import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "@middleware/auth.middleware";
import {
  analyzeEntry,
  dailyReflection,
  weeklySummary,
  monthlySummary,
  chat,
  listConversations,
  getConversation,
  generateInsights,
  listInsights,
  dismissInsight,
  saveInsight,
  semanticSearch,
  relatedEntries,
} from "@controllers/ai.controller";

const router = Router();
router.use(requireAuth);

// AI calls hit a paid third-party API - keep the limit tighter than general API traffic.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(aiLimiter);

router.post("/analyze/:entryId", analyzeEntry);
router.post("/daily-reflection", dailyReflection);
router.post("/weekly-summary", weeklySummary);
router.post("/monthly-summary", monthlySummary);

router.post("/chat", chat);
router.get("/conversations", listConversations);
router.get("/conversations/:id", getConversation);

router.post("/generate-insights", generateInsights);
router.get("/insights", listInsights);
router.patch("/insights/:id/dismiss", dismissInsight);
router.patch("/insights/:id/save", saveInsight);

router.get("/search", semanticSearch);
router.get("/related/:entryId", relatedEntries);

export default router;
