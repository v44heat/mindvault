import { Schema, model, Document, Types } from "mongoose";

export interface IAiInsight extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  insight: string;
  supportingEntryIds: Types.ObjectId[];
  confidence: "low" | "medium" | "high";
  isDismissed: boolean;
  isSaved: boolean;
  discoveredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aiInsightSchema = new Schema<IAiInsight>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    insight: { type: String, required: true },
    supportingEntryIds: [{ type: Schema.Types.ObjectId, ref: "JournalEntry" }],
    confidence: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    isDismissed: { type: Boolean, default: false },
    isSaved: { type: Boolean, default: false },
    discoveredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

aiInsightSchema.index({ userId: 1, isDismissed: 1, discoveredAt: -1 });

export const AiInsight = model<IAiInsight>("AiInsight", aiInsightSchema);
