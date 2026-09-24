import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search as SearchIcon } from "lucide-react";
import { listEntries } from "../api/journal";
import { EntryCard } from "../components/EntryCard";

export function JournalListPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["journal-entries", page, q],
    queryFn: () => listEntries({ page, limit: 12, q: q || undefined }),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-100">Journal</h1>
        <div className="flex items-center gap-4">
          <Link to="/journal/archive" className="text-sm font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100">
            Archive
          </Link>
          <Link to="/journal/trash" className="text-sm font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100">
            Trash
          </Link>
          <Link
            to="/journal/new"
            className="flex items-center gap-2 rounded-full bg-plum-600 px-4 py-2 text-sm font-semibold text-white hover:bg-plum-500"
          >
            <Plus className="h-4 w-4" /> New Entry
          </Link>
        </div>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search your journal…"
          className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100 dark:border-ink-800 dark:bg-ink-900 dark:focus:ring-ink-800"
        />
      </div>

      {isLoading && (
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />
          ))}
        </div>
      )}

      {!isLoading && (data?.entries.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-800">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {q ? "No entries match your search." : "No entries yet — write your first one."}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {data?.entries.map((entry) => (
          <EntryCard key={entry._id} entry={entry} />
        ))}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-ink-200 px-3 py-1.5 disabled:opacity-40 dark:border-ink-800"
          >
            Previous
          </button>
          <span className="text-ink-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-ink-200 px-3 py-1.5 disabled:opacity-40 dark:border-ink-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
