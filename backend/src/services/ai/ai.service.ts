import { ZodSchema } from "zod";
import { AppError } from "@utils/asyncHandler";
import { env } from "@config/env";
import { AiProvider } from "./provider";
import { OpenAiProvider } from "./openai.provider";

/**
 * Provider is selected by AI_PROVIDER env var so a different LLM backend can be
 * substituted later without any caller of `generateStructured` changing.
 */
function getProvider(): AiProvider {
  switch (env.aiProvider) {
    case "openai":
    default:
      return new OpenAiProvider();
  }
}

function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
}

/**
 * Asks the configured provider for JSON and validates it against a Zod schema
 * before returning it, so a malformed AI response never reaches the database
 * or the client silently.
 */
export async function generateStructured<T>(
  system: string,
  user: string,
  schema: ZodSchema<T>,
  maxTokens?: number
): Promise<T> {
  const provider = getProvider();
  const raw = await provider.complete({ system, user, maxTokens });

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFences(raw));
  } catch {
    throw new AppError("The AI response could not be parsed", 502, "AI_INVALID_RESPONSE");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    console.error("[ai] Response failed schema validation:", result.error.issues);
    throw new AppError("The AI response did not match the expected format", 502, "AI_INVALID_RESPONSE");
  }

  return result.data;
}
