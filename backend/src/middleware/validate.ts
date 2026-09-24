import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "@utils/asyncHandler";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new AppError(message, 400, "VALIDATION_ERROR");
    }
    req.body = result.data;
    next();
  };
}
