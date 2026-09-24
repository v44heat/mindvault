import path from "path";
import fs from "fs";
import crypto from "crypto";
import { AppError } from "@utils/asyncHandler";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Local-disk implementation of file storage. Swap this out for a Cloudinary
 * or S3-backed implementation in production - callers only depend on
 * `saveImage`'s signature, not on how/where bytes are persisted.
 */
export async function saveImage(userId: string, file: Express.Multer.File): Promise<{ url: string }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    throw new AppError("Unsupported image type", 400, "INVALID_FILE_TYPE");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new AppError("Image exceeds the 8MB limit", 400, "FILE_TOO_LARGE");
  }

  const ext = path.extname(file.originalname) || ".jpg";
  const safeUserId = userId.replace(/[^a-fA-F0-9]/g, "");
  const filename = `${safeUserId}_${crypto.randomBytes(8).toString("hex")}${ext}`;
  const destination = path.join(UPLOAD_DIR, filename);

  await fs.promises.writeFile(destination, file.buffer);

  return { url: `/uploads/${filename}` };
}
