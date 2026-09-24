import { Schema, model, Document, Types } from "mongoose";

export interface IHabit extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  icon: string;
  frequency: "daily" | "weekly";
  /** ISO date strings (yyyy-mm-dd) the user checked this habit off - one per completed day. */
  checkIns: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const habitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    icon: { type: String, default: "✅" },
    frequency: { type: String, enum: ["daily", "weekly"], default: "daily" },
    checkIns: { type: [String], default: [] },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

habitSchema.index({ userId: 1, isArchived: 1 });

export const Habit = model<IHabit>("Habit", habitSchema);
