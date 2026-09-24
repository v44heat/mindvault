import { z } from "zod";
import { SAFETY_RULES, JSON_ONLY_INSTRUCTION } from "./safety";

export const chatResponseSchema = z.object({
  answer: z.string(),
  usedEntryNumbers: z.array(z.number().int()).max(10),
});

export type ChatResponseResult = z.infer<typeof chatResponseSchema>;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function buildChatPrompt(
  question: string,
  entries: { title: string; text: string; date: string }[],
  history: ChatTurn[]
) {
  const system = `${SAFETY_RULES}

You are MindVault's journal assistant. You answer questions about the person's own journal
using ONLY the journal excerpts provided below - never information from outside the journal,
and never information belonging to any other user (you were only given this person's own
entries). If the provided excerpts don't contain the answer, say so honestly instead of
guessing. ${JSON_ONLY_INSTRUCTION}

The JSON object must have exactly these keys:
- "answer": a natural, conversational answer to the question, grounded only in the excerpts
- "usedEntryNumbers": the entry numbers (as given below) that your answer actually draws on`;

  const entriesBlock = entries.length
    ? entries
        .map((e, i) => `Entry ${i + 1} (${e.date})${e.title ? ` - "${e.title}"` : ""}:\n${e.text}`)
        .join("\n\n---\n\n")
    : "(No matching journal entries were found for this question.)";

  const historyBlock = history.length
    ? "\n\nConversation so far:\n" + history.map((h) => `${h.role === "user" ? "Person" : "Assistant"}: ${h.content}`).join("\n")
    : "";

  const user = `Relevant journal excerpts:\n\n${entriesBlock}${historyBlock}\n\nPerson's question: ${question}`;

  return { system, user };
}
