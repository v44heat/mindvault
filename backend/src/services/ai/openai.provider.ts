import OpenAI from "openai";
import { env } from "@config/env";
import { AppError } from "@utils/asyncHandler";
import { AiCompletionRequest, AiProvider } from "./provider";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.openaiApiKey) {
    throw new AppError(
      "AI features are not configured on this server. Set OPENAI_API_KEY to enable them.",
      503,
      "AI_NOT_CONFIGURED"
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
}

export class OpenAiProvider implements AiProvider {
  async complete({ system, user, maxTokens }: AiCompletionRequest): Promise<string> {
    const openai = getClient();

    try {
      const response = await openai.chat.completions.create({
        model: env.openaiModel,
        max_tokens: maxTokens ?? 800,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const text = response.choices[0]?.message?.content;
      if (!text) {
        throw new AppError("The AI provider returned an empty response", 502, "AI_EMPTY_RESPONSE");
      }
      return text;
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error("[ai] OpenAI request failed:", err instanceof Error ? err.message : err);
      throw new AppError("The AI provider is temporarily unavailable. Please try again.", 502, "AI_PROVIDER_ERROR");
    }
  }
}
