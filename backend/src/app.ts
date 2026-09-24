import express, { Application } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "@config/env";
import { notFoundHandler, errorHandler } from "@middleware/errorHandler";

import authRoutes from "@routes/auth.routes";
import journalRoutes from "@routes/journal.routes";
import analyticsRoutes from "@routes/analytics.routes";
import uploadRoutes from "@routes/upload.routes";
import aiRoutes from "@routes/ai.routes";
import habitRoutes from "@routes/habit.routes";
import goalRoutes from "@routes/goal.routes";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  // Never log request bodies (journal content must not hit server logs).
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  const apiLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ success: true, message: "MindVault API is running" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/journal", journalRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/habits", habitRoutes);
  app.use("/api/goals", goalRoutes);

  // Locally-stored images (dev-only stand-in for Cloudinary/S3 in production).
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
