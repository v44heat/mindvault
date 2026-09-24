import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@utils/jwt";
import { AppError } from "@utils/asyncHandler";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Derives the authenticated user's identity strictly from the verified JWT.
 * Never trust a userId supplied by the client body/query/params.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.accessToken;

  if (!token) {
    throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
  }
}
