export interface AiCompletionRequest {
  system: string;
  user: string;
  /** Keep responses small and cheap; callers ask for structured JSON so this rarely needs to be large. */
  maxTokens?: number;
}

export interface AiProvider {
  /** Returns raw text from the model. Callers are responsible for parsing/validating it. */
  complete(request: AiCompletionRequest): Promise<string>;
}
