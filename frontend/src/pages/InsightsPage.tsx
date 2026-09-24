import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Send, Loader2, X, Check, RefreshCw } from "lucide-react";
import * as aiApi from "../api/ai";

type Tab = "insights" | "chat" | "reflect";

export function InsightsPage() {
  const [tab, setTab] = useState<Tab>("insights");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-100">AI Insights</h1>
        <div className="flex rounded-xl border border-ink-200 p-1 dark:border-ink-800">
          {(["insights", "chat", "reflect"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                tab === t ? "bg-plum-600 text-white" : "text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
              }`}
            >
              {t === "reflect" ? "Reflections" : t === "chat" ? "Ask AI" : "Insights"}
            </button>
          ))}
        </div>
      </div>

      {tab === "insights" && <InsightsTab />}
      {tab === "chat" && <ChatTab />}
      {tab === "reflect" && <ReflectTab />}
    </div>
  );
}

function InsightsTab() {
  const queryClient = useQueryClient();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: aiApi.listInsights,
  });

  const generateMutation = useMutation({
    mutationFn: aiApi.generateInsights,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-insights"] }),
  });

  const dismissMutation = useMutation({
    mutationFn: aiApi.dismissInsight,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-insights"] }),
  });

  const saveMutation = useMutation({
    mutationFn: aiApi.saveInsight,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-insights"] }),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Patterns MindVault notices across your own entries — never a diagnosis, always grounded
          in what you wrote.
        </p>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-plum-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-plum-500 disabled:opacity-60"
        >
          {generateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Generate
        </button>
      </div>

      {generateMutation.isError && (
        <p className="mb-4 text-sm text-red-500">
          {(generateMutation.error as any)?.response?.data?.message ?? "Couldn't generate insights."}
        </p>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />
          ))}
        </div>
      )}

      {!isLoading && (insights?.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-800">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            No insights yet. Write a few more entries, then generate some.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {insights?.map((insight) => (
          <div
            key={insight._id}
            className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-ink-800 dark:text-ink-100">{insight.insight}</p>
              <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-400 dark:bg-ink-800">
                {insight.confidence}
              </span>
            </div>

            {insight.supportingEntryIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {insight.supportingEntryIds.map((e) => (
                  <Link
                    key={e._id}
                    to={`/journal/${e._id}`}
                    className="rounded-full bg-plum-100 px-2.5 py-1 text-xs text-plum-600 hover:bg-plum-200 dark:bg-ink-800 dark:text-plum-300"
                  >
                    {e.title || "Untitled entry"}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => saveMutation.mutate(insight._id)}
                disabled={insight.isSaved}
                className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-plum-600 disabled:text-plum-600"
              >
                <Check className="h-3.5 w-3.5" /> {insight.isSaved ? "Saved" : "Save"}
              </button>
              <button
                onClick={() => dismissMutation.mutate(insight._id)}
                className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" /> Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: aiApi.ChatSource[];
}

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: (message: string) => aiApi.chat(message, conversationId),
    onSuccess: (res) => {
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer, sources: res.sources }]);
    },
    onError: (err: any) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err?.response?.data?.message ?? "Something went wrong. Please try again." },
      ]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    chatMutation.mutate(text);
  }

  const suggestions = [
    "What did I work on last week?",
    "What have I been grateful for lately?",
    "Summarize my recent entries",
  ];

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
      <div className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-2 h-6 w-6 text-plum-400" />
            <p className="text-sm text-ink-500 dark:text-ink-400">Ask MindVault something about your own journal.</p>
            <div className="mt-4 flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setMessages((prev) => [...prev, { role: "user", content: s }]);
                    chatMutation.mutate(s);
                  }}
                  className="rounded-full border border-ink-200 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-plum-600 text-white"
                    : "bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100"
                }`}
              >
                <p>{m.content}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.sources.map((s) => (
                      <Link
                        key={s.id}
                        to={`/journal/${s.id}`}
                        className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-plum-700 hover:bg-white dark:bg-ink-900/70 dark:text-plum-300"
                      >
                        {s.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-ink-100 px-4 py-2.5 text-sm text-ink-500 dark:bg-ink-800">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-ink-100 p-3 dark:border-ink-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your journal…"
          className="flex-1 rounded-xl border border-ink-200 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100 dark:border-ink-700 dark:focus:ring-ink-800"
        />
        <button
          type="submit"
          disabled={chatMutation.isPending || !input.trim()}
          className="rounded-xl bg-plum-600 p-2.5 text-white transition hover:bg-plum-500 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function ReflectTab() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  const dailyMutation = useMutation({ mutationFn: () => aiApi.dailyReflection() });
  const weeklyMutation = useMutation({ mutationFn: () => aiApi.weeklySummary() });
  const monthlyMutation = useMutation({ mutationFn: () => aiApi.monthlySummary() });

  const activeMutation = period === "day" ? dailyMutation : period === "week" ? weeklyMutation : monthlyMutation;
  const result = activeMutation.data
    ? "reflection" in activeMutation.data
      ? activeMutation.data.reflection
      : activeMutation.data.summary
    : undefined;
  const entryCount = activeMutation.data?.entryCount;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {(["day", "week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
              period === p
                ? "bg-plum-600 text-white"
                : "border border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
            }`}
          >
            {p === "day" ? "Today" : p === "week" ? "This week" : "This month"}
          </button>
        ))}
        <button
          onClick={() => activeMutation.mutate()}
          disabled={activeMutation.isPending}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-900"
        >
          {activeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Reflect
        </button>
      </div>

      {activeMutation.isError && (
        <p className="text-sm text-red-500">
          {(activeMutation.error as any)?.response?.data?.message ?? "Couldn't generate a reflection."}
        </p>
      )}

      {!activeMutation.data && !activeMutation.isPending && !activeMutation.isError && (
        <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-800">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Click "Reflect" to have AI summarize your entries from this {period}.
          </p>
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p className="mb-1 text-xs text-ink-400">Based on {entryCount} {entryCount === 1 ? "entry" : "entries"}</p>
          <p className="text-sm text-ink-800 dark:text-ink-100">{result.summary}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ReflectRow label="Major events" items={result.majorEvents} />
            <ReflectRow label="Most discussed" items={result.mostDiscussedTopics} />
            <ReflectRow label="Achievements" items={result.achievements} />
            <ReflectRow label="Challenges" items={result.challenges} />
          </div>

          <p className="mt-4 text-sm text-ink-600 dark:text-ink-300">
            <span className="font-medium">Mood: </span>
            {result.moodOverview}
          </p>

          {result.reflectionQuestions.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Consider</p>
              <ul className="flex flex-col gap-1 text-sm text-ink-600 dark:text-ink-300">
                {result.reflectionQuestions.map((q, i) => (
                  <li key={i}>• {q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReflectRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <ul className="flex flex-col gap-0.5 text-sm text-ink-600 dark:text-ink-300">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
