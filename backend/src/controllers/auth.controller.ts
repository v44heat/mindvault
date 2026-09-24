import { Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { registerUser, loginUser, createPasswordResetToken } from "@services/auth.service";
import { AuthenticatedRequest } from "@middleware/auth.middleware";
import { User } from "@models/User.model";
import { env } from "@config/env";

const REFRESH_COOKIE_NAME = "refreshToken";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/api/auth",
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await registerUser(name, email, password);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({
    success: true,
    data: { user: user.toJSON(), accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await loginUser(email, password);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({
    success: true,
    data: { user: user.toJSON(), accessToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  res.status(200).json({ success: true, message: "Logged out" });
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found", errorCode: "NOT_FOUND" });
    return;
  }
  res.status(200).json({ success: true, data: { user: user.toJSON() } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await createPasswordResetToken(email);
  // Always return a generic success response so we never leak account existence.
  res.status(200).json({
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  // Token verification + password update wired up once email delivery exists.
  res.status(501).json({
    success: false,
    message: "Password reset via email is not yet configured on this server.",
    errorCode: "NOT_IMPLEMENTED",
  });
});
