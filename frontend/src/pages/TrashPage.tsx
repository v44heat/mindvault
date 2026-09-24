import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import * as journalApi from "../api/journal";

export function TrashPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["journal-trash"],
    queryFn: journalApi.listTrash,
  });

  const restoreMutation = useMutation({
    mutationFn: journalApi.restoreEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-trash"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: journalApi.permanentlyDeleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-trash"] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold text-ink-900 dark:text-ink-100">Trash</h1>
      <p className="mb-6 text-sm text-ink-500 dark:text-ink-400">
        Deleted entries land here first. Restore them, or remove them for good.
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
          <p className="text-sm text-ink-500 dark:text-ink-400">Trash is empty.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {data?.entries.map((entry) => (
          <div
            key={entry._id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
          >
            <div className="min-w-0">
              <p className="text-xs text-ink-400">{format(new Date(entry.entryDate), "MMM d, yyyy")}</p>
              <p className="truncate font-medium text-ink-900 dark:text-ink-100">{entry.title || "Untitled entry"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                title="Restore"
                onClick={() => restoreMutation.mutate(entry._id)}
                className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                title="Delete permanently"
                onClick={() => {
                  if (confirm("Permanently delete this entry? This can't be undone.")) {
                    permanentDeleteMutation.mutate(entry._id);
                  }
                }}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
