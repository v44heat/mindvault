import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User, IUser } from "@models/User.model";
import { signAccessToken, signRefreshToken } from "@utils/jwt";
import { AppError } from "@utils/asyncHandler";

const SALT_ROUNDS = 12;

export async function registerUser(name: string, email: string, password: string) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists", 409, "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  return issueTokensFor(user);
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  return issueTokensFor(user);
}

function issueTokensFor(user: IUser) {
  const accessToken = signAccessToken({ userId: user._id.toString() });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });
  return { user, accessToken, refreshToken };
}

/**
 * Generates a password reset token. In production this would be emailed to the
 * user rather than returned to the caller; the architecture is in place for
 * that (a hashed token + expiry stored on the user) but actual email delivery
 * is left as a follow-up integration (see README - Future Improvements).
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await User.findOne({ email });
  if (!user) {
    // Do not reveal whether the email exists.
    return null;
  }
  const rawToken = crypto.randomBytes(32).toString("hex");
  // Storage of the hashed token + expiry would live on the user document;
  // omitted here to keep the User model lean until email delivery is wired up.
  return rawToken;
}
