import { Schema, model, Document, Types } from "mongoose";

interface IMilestone {
  _id: Types.ObjectId;
  title: string;
  completed: boolean;
  dueDate?: Date;
}

export interface IGoal extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description: string;
  startDate: Date;
  targetDate?: Date;
  progress: number; // 0-100, manually set or derived from milestones
  status: "active" | "completed" | "abandoned";
  milestones: Types.DocumentArray<IMilestone>;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date },
});

const goalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 2000 },
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ["active", "completed", "abandoned"], default: "active" },
    milestones: { type: [milestoneSchema], default: [] },
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, status: 1 });

export const Goal = model<IGoal>("Goal", goalSchema);
