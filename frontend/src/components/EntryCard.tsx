import { Link } from "react-router-dom";
import { Pin } from "lucide-react";
import { format } from "date-fns";
import type { JournalEntry } from "../types";
import { MoodBadge } from "./MoodBadge";

function excerpt(text: string, length = 140): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "…";
}

export function EntryCard({ entry }: { entry: JournalEntry }) {
  return (
    <Link
      to={`/journal/${entry._id}`}
      className="block rounded-2xl border border-ink-200 bg-white p-5 transition hover:border-plum-300 hover:shadow-sm dark:border-ink-800 dark:bg-ink-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <span>{format(new Date(entry.entryDate), "MMM d, yyyy")}</span>
            {entry.isPinned && <Pin className="h-3.5 w-3.5 text-plum-500" />}
          </div>
          <h3 className="mt-1 truncate text-base font-semibold text-ink-900 dark:text-ink-100">
            {entry.title || "Untitled entry"}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">
            {excerpt(entry.contentText)}
          </p>
        </div>
        <MoodBadge mood={entry.mood} />
      </div>
      {entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-plum-100 px-2 py-0.5 text-xs text-plum-600 dark:bg-ink-800 dark:text-plum-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
