import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArchiveRestore } from "lucide-react";
import { Link } from "react-router-dom";
import * as journalApi from "../api/journal";
import { MoodBadge } from "../components/MoodBadge";
import { format } from "date-fns";

export function ArchivePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["journal-entries", "archived"],
    queryFn: () => journalApi.listEntries({ archived: true, limit: 50 }),
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => journalApi.setArchived(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold text-ink-900 dark:text-ink-100">Archive</h1>
      <p className="mb-6 text-sm text-ink-500 dark:text-ink-400">
        Archived entries stay out of your main journal view but are never deleted.
      </p>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />
          ))}
        </div>
      )}

      {!isLoading && (data?.entries.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-800">
          <p className="text-sm text-ink-500 dark:text-ink-400">Nothing archived yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {data?.entries.map((entry) => (
          <div
            key={entry._id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
          >
            <Link to={`/journal/${entry._id}`} className="min-w-0">
              <p className="text-xs text-ink-400">{format(new Date(entry.entryDate), "MMM d, yyyy")}</p>
              <p className="truncate font-medium text-ink-900 dark:text-ink-100">{entry.title || "Untitled entry"}</p>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <MoodBadge mood={entry.mood} />
              <button
                title="Unarchive"
                onClick={() => unarchiveMutation.mutate(entry._id)}
                className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <ArchiveRestore className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
