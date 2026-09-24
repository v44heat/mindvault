import { env } from "@config/env";
import { AppError } from "@utils/asyncHandler";
import { Embedding, IEmbedding } from "@models/Embedding.model";

let client: import("openai").default | null = null;

async function getClient() {
  if (!env.openaiApiKey) {
    throw new AppError("AI features are not configured on this server.", 503, "AI_NOT_CONFIGURED");
  }
  if (!client) {
    const OpenAI = (await import("openai")).default;
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
}

const MAX_EMBEDDING_CHARS = 8000;

export async function embedText(text: string): Promise<number[]> {
  const openai = await getClient();
  const input = text.slice(0, MAX_EMBEDDING_CHARS) || " ";

  try {
    const response = await openai.embeddings.create({
      model: env.openaiEmbeddingModel,
      input,
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error("[embeddings] request failed:", err instanceof Error ? err.message : err);
    throw new AppError("Couldn't generate an embedding right now.", 502, "AI_PROVIDER_ERROR");
  }
}

/**
 * Creates or refreshes the embedding for one journal entry. Called after an
 * entry is created/updated. Failures here never block a journal save - search
 * indexing is best-effort, so a missing OPENAI_API_KEY degrades to "semantic
 * search finds nothing yet" rather than breaking normal journaling.
 */
export async function indexEntry(entryId: string, userId: string, text: string): Promise<void> {
  try {
    const vector = await embedText(text);
    await Embedding.findOneAndUpdate(
      { entryId },
      { entryId, userId, embeddingModel: env.openaiEmbeddingModel, vector },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn(
      `[embeddings] Skipped indexing entry ${entryId}:`,
      err instanceof Error ? err.message : err
    );
  }
}

export async function removeEntryIndex(entryId: string): Promise<void> {
  await Embedding.deleteOne({ entryId });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Provider-agnostic similarity search. This is the in-memory cosine-similarity
 * implementation used when MongoDB Atlas Vector Search isn't available; if a
 * future deployment runs on Atlas, this function is the only place that needs
 * to change to use `$vectorSearch` instead, since every caller only depends
 * on this signature.
 */
export async function findSimilarEntryIds(
  userId: string,
  queryVector: number[],
  limit: number,
  excludeEntryId?: string
): Promise<{ entryId: string; score: number }[]> {
  const candidates: IEmbedding[] = await Embedding.find({ userId });

  const scored = candidates
    .filter((c) => c.entryId.toString() !== excludeEntryId)
    .map((c) => ({ entryId: c.entryId.toString(), score: cosineSimilarity(queryVector, c.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
