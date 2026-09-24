import { JournalEntry, IJournalEntry } from "@models/JournalEntry.model";
import { AiConversation, IAiConversation } from "@models/AiConversation.model";
import { AppError } from "@utils/asyncHandler";
import { generateStructured } from "./ai.service";
import { buildChatPrompt, chatResponseSchema, ChatTurn } from "./prompts/chat";

const MAX_RETRIEVED_ENTRIES = 8;
const MAX_ENTRY_CHARS = 1500;
const MAX_HISTORY_TURNS = 6;

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

/**
 * Retrieves entries relevant to the question, strictly scoped to this user.
 * Uses MongoDB's text index first; falls back to recent entries so the
 * assistant still has *some* grounded context for vague questions.
 */
async function retrieveRelevantEntries(userId: string, question: string): Promise<IJournalEntry[]> {
  const textResults = await JournalEntry.find(
    { userId, isDeleted: false, $text: { $search: question } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(MAX_RETRIEVED_ENTRIES);

  if (textResults.length > 0) return textResults;

  return JournalEntry.find({ userId, isDeleted: false })
    .sort({ entryDate: -1 })
    .limit(MAX_RETRIEVED_ENTRIES);
}

async function findOwnedConversation(conversationId: string, userId: string): Promise<IAiConversation> {
  const conversation = await AiConversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new AppError("Conversation not found", 404, "CONVERSATION_NOT_FOUND");
  }
  return conversation;
}

export async function chat(userId: string, message: string, conversationId?: string) {
  if (!message.trim()) {
    throw new AppError("Message cannot be empty", 400, "VALIDATION_ERROR");
  }

  const conversation = conversationId
    ? await findOwnedConversation(conversationId, userId)
    : new AiConversation({ userId, title: message.slice(0, 60) });

  const entries = await retrieveRelevantEntries(userId, message);
  const promptEntries = entries.map((e) => ({
    title: e.title,
    text: truncate(e.contentText, MAX_ENTRY_CHARS),
    date: e.entryDate.toISOString().slice(0, 10),
  }));

  const history: ChatTurn[] = conversation.messages.slice(-MAX_HISTORY_TURNS).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const { system, user } = buildChatPrompt(message, promptEntries, history);
  const { answer, usedEntryNumbers } = await generateStructured(system, user, chatResponseSchema, 700);

  const usedEntries = usedEntryNumbers.map((n) => entries[n - 1]).filter((e): e is IJournalEntry => Boolean(e));

  conversation.messages.push({
    role: "user",
    content: message,
    usedEntryIds: [],
    createdAt: new Date(),
  });
  conversation.messages.push({
    role: "assistant",
    content: answer,
    usedEntryIds: usedEntries.map((e) => e._id),
    createdAt: new Date(),
  });
  await conversation.save();

  return {
    conversationId: conversation._id.toString(),
    answer,
    sources: usedEntries.map((e) => ({ id: e._id.toString(), title: e.title || "Untitled entry" })),
  };
}

export async function listConversations(userId: string) {
  return AiConversation.find({ userId }).sort({ updatedAt: -1 }).limit(20).select("title updatedAt");
}

export async function getConversation(id: string, userId: string) {
  return findOwnedConversation(id, userId);
}
