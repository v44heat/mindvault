import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  profileImage?: string;
  timezone: string;
  onboardingCompleted: boolean;
  preferences: {
    theme: "light" | "dark" | "system";
    journalingGoal?: string;
    reminderTime?: string;
    defaultEntryPrivacy: "private" | "shared";
    aiAnalysisEnabled: boolean;
    moodTrackingEnabled: boolean;
    streakTrackingEnabled: boolean;
    weeklySummaryEmails: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    profileImage: { type: String },
    timezone: { type: String, default: "UTC" },
    onboardingCompleted: { type: Boolean, default: false },
    preferences: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      journalingGoal: { type: String },
      reminderTime: { type: String },
      defaultEntryPrivacy: { type: String, enum: ["private", "shared"], default: "private" },
      aiAnalysisEnabled: { type: Boolean, default: true },
      moodTrackingEnabled: { type: Boolean, default: true },
      streakTrackingEnabled: { type: Boolean, default: true },
      weeklySummaryEmails: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Never leak the password hash even if `select` is overridden somewhere.
userSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = model<IUser>("User", userSchema);
