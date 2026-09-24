import { Request, Response, NextFunction } from "express";
import { AppError } from "@utils/asyncHandler";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errorCode: "NOT_FOUND",
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
    });
    return;
  }

  // Mongoose validation errors
  if (err && typeof err === "object" && "name" in err && (err as any).name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: (err as Error).message,
      errorCode: "VALIDATION_ERROR",
    });
    return;
  }

  // Mongo duplicate key (e.g. email already registered)
  if (err && typeof err === "object" && (err as any).code === 11000) {
    res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      errorCode: "DUPLICATE_KEY",
    });
    return;
  }

  // Never log journal content; only log the error shape.
  console.error("[error]", err instanceof Error ? err.message : err);

  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    errorCode: "INTERNAL_ERROR",
  });
}
