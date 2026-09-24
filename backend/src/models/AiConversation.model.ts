import { Schema, model, Document, Types } from "mongoose";

interface IAiMessage {
  role: "user" | "assistant";
  content: string;
  usedEntryIds: Types.ObjectId[];
  createdAt: Date;
}

export interface IAiConversation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  messages: IAiMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const aiMessageSchema = new Schema<IAiMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    usedEntryIds: [{ type: Schema.Types.ObjectId, ref: "JournalEntry" }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiConversationSchema = new Schema<IAiConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New conversation" },
    messages: { type: [aiMessageSchema], default: [] },
  },
  { timestamps: true }
);

aiConversationSchema.index({ userId: 1, updatedAt: -1 });

export const AiConversation = model<IAiConversation>("AiConversation", aiConversationSchema);
