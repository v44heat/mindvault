import { Schema, model, Document, Types } from "mongoose";

export interface IEmbedding extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  entryId: Types.ObjectId;
  embeddingModel: string;
  vector: number[];
  createdAt: Date;
  updatedAt: Date;
}

const embeddingSchema = new Schema<IEmbedding>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    entryId: { type: Schema.Types.ObjectId, ref: "JournalEntry", required: true, unique: true },
    embeddingModel: { type: String, required: true },
    vector: { type: [Number], required: true },
  },
  { timestamps: true }
);

embeddingSchema.index({ userId: 1 });

export const Embedding = model<IEmbedding>("Embedding", embeddingSchema);
