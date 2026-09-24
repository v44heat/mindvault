import { Router } from "express";
import { register, login, logout, me, forgotPassword, resetPassword } from "@controllers/auth.controller";
import { validateBody } from "@middleware/validate";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@validators/auth.validators";
import { requireAuth } from "@middleware/auth.middleware";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);

export default router;
