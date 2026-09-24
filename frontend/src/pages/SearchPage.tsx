import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import * as aiApi from "../api/ai";
import { EntryCard } from "../components/EntryCard";

const SUGGESTIONS = [
  "that time I was stuck on a database problem",
  "times I felt proud",
  "notes about a project I was building",
];

export function SearchPage() {
  const [query, setQuery] = useState("");

  const searchMutation = useMutation({
    mutationFn: aiApi.semanticSearch,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate(query.trim());
  }

  function runSuggestion(s: string) {
    setQuery(s);
    searchMutation.mutate(s);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold text-ink-900 dark:text-ink-100">Search your memories</h1>
      <p className="mb-6 text-sm text-ink-500 dark:text-ink-400">
        Describe what you're looking for in your own words — MindVault searches by meaning, not just keywords.
      </p>

      <form onSubmit={handleSubmit} className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. that time I was struggling with database design…"
          className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-24 text-sm outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100 dark:border-ink-800 dark:bg-ink-900 dark:focus:ring-ink-800"
        />
        <button
          type="submit"
          disabled={searchMutation.isPending || !query.trim()}
          className="absolute right-1.5 top-1.5 rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-plum-500 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {!searchMutation.data && !searchMutation.isPending && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => runSuggestion(s)}
              className="rounded-full border border-ink-200 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {searchMutation.isPending && (
        <div className="mt-6 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <Sparkles className="h-4 w-4 animate-pulse text-plum-400" /> Searching your journal…
        </div>
      )}

      {searchMutation.isError && (
        <p className="mt-6 text-sm text-red-500">
          {(searchMutation.error as any)?.response?.data?.message ?? "Couldn't search right now."}
        </p>
      )}

      {searchMutation.data && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            {searchMutation.data.length} {searchMutation.data.length === 1 ? "result" : "results"}
          </p>
          {searchMutation.data.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-800">
              <p className="text-sm text-ink-500 dark:text-ink-400">Nothing matched that. Try describing it differently.</p>
            </div>
          )}
          <div className="grid gap-3">
            {searchMutation.data.map((entry) => (
              <EntryCard key={entry._id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
