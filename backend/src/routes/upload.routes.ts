import { Router } from "express";
import multer from "multer";
import { asyncHandler, AppError } from "@utils/asyncHandler";
import { requireAuth, AuthenticatedRequest } from "@middleware/auth.middleware";
import { saveImage } from "@services/upload.service";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth);

router.post(
  "/image",
  upload.single("image"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.file) {
      throw new AppError("No image file provided", 400, "MISSING_FILE");
    }
    const result = await saveImage(req.userId!, req.file);
    res.status(201).json({ success: true, data: result });
  })
);

export default router;
