import { Router } from "express";
import { requireAuth } from "@middleware/auth.middleware";
import {
  createEntry,
  listEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  archiveEntry,
  pinEntry,
  listTrash,
  restoreEntry,
  permanentlyDeleteEntry,
  getCalendarMonth,
  getTimeline,
  getOnThisDay,
} from "@controllers/journal.controller";

const router = Router();

router.use(requireAuth);

// Specific paths must be declared before the /:id param routes below.
router.get("/trash", listTrash);
router.get("/calendar", getCalendarMonth);
router.get("/timeline", getTimeline);
router.get("/on-this-day", getOnThisDay);

router.get("/", listEntries);
router.post("/", createEntry);
router.get("/:id", getEntry);
router.put("/:id", updateEntry);
router.delete("/:id", deleteEntry);
router.patch("/:id/archive", archiveEntry);
router.patch("/:id/pin", pinEntry);
router.patch("/:id/restore", restoreEntry);
router.delete("/:id/permanent", permanentlyDeleteEntry);

export default router;
