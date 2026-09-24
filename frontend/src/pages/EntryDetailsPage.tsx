import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Pencil, Pin, Archive, Trash2, Sparkles, Loader2, Link2 } from "lucide-react";
import * as journalApi from "../api/journal";
import * as aiApi from "../api/ai";
import { MoodBadge } from "../components/MoodBadge";

export function EntryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["journal-entry", id],
    queryFn: () => journalApi.getEntry(id!),
    enabled: Boolean(id),
  });

  const { data: related } = useQuery({
    queryKey: ["related-entries", id],
    queryFn: () => aiApi.relatedEntries(id!),
    enabled: Boolean(id),
    retry: false,
  });

  const pinMutation = useMutation({
    mutationFn: () => journalApi.setPinned(id!, !entry?.isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entry", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => journalApi.setArchived(id!, true),
    onSuccess: () => navigate("/journal"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => journalApi.deleteEntry(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      navigate("/journal");
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => aiApi.analyzeEntry(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(["journal-entry", id], updated);
    },
  });

  if (isLoading || !entry) {
    return <div className="mx-auto max-w-3xl h-64 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-ink-400">{format(new Date(entry.entryDate), "EEEE, MMMM d, yyyy")}</span>
        <div className="flex items-center gap-1">
          <IconButton title="Pin" onClick={() => pinMutation.mutate()} active={entry.isPinned}>
            <Pin className="h-4 w-4" />
          </IconButton>
          <IconButton title="Edit" onClick={() => navigate(`/journal/${id}/edit`)}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton title="Archive" onClick={() => archiveMutation.mutate()}>
            <Archive className="h-4 w-4" />
          </IconButton>
          <IconButton
            title="Move to trash"
            onClick={() => {
              if (confirm("Move this entry to trash?")) deleteMutation.mutate();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <h1 className="text-3xl font-semibold text-ink-900 dark:text-ink-100">
        {entry.title || "Untitled entry"}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MoodBadge mood={entry.mood} />
        {entry.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-plum-100 px-2.5 py-1 text-xs text-plum-600 dark:bg-ink-800 dark:text-plum-300"
          >
            #{tag}
          </span>
        ))}
        <span className="text-xs text-ink-400">
          {entry.wordCount} words · {entry.readingTime} min read
        </span>
      </div>

      <div
        className="prose prose-ink mt-6 max-w-none dark:prose-invert [&_p]:my-3"
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />

      <div className="mt-8 rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
            <Sparkles className="h-4 w-4 text-plum-500" /> AI Analysis
          </div>
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="flex items-center gap-1.5 rounded-full bg-plum-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-plum-500 disabled:opacity-60"
          >
            {analyzeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {entry.aiAnalysis ? "Re-analyze" : "Analyze with AI"}
          </button>
        </div>

        {analyzeMutation.isError && (
          <p className="mt-3 text-sm text-red-500">
            {(analyzeMutation.error as any)?.response?.data?.message ?? "Couldn't analyze this entry."}
          </p>
        )}

        {!entry.aiAnalysis && !analyzeMutation.isPending && (
          <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
            Get a summary, themes, and reflection questions grounded in what you actually wrote.
          </p>
        )}

        {entry.aiAnalysis && (
          <div className="mt-4 flex flex-col gap-4 text-sm">
            {entry.aiAnalysis.summary && (
              <p className="text-ink-700 dark:text-ink-200">{entry.aiAnalysis.summary}</p>
            )}
            <AnalysisRow label="Themes" items={entry.aiAnalysis.themes} />
            <AnalysisRow label="Emotions" items={entry.aiAnalysis.emotions} />
            <AnalysisRow label="Positive moments" items={entry.aiAnalysis.positiveMoments} />
            <AnalysisRow label="Challenges" items={entry.aiAnalysis.challenges} />
            <AnalysisRow label="Action items" items={entry.aiAnalysis.actionItems} />
            {entry.aiAnalysis.reflectionQuestions && entry.aiAnalysis.reflectionQuestions.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Reflect further</p>
                <ul className="flex flex-col gap-1 text-ink-600 dark:text-ink-300">
                  {entry.aiAnalysis.reflectionQuestions.map((q, i) => (
                    <li key={i}>• {q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {related && related.length > 0 && (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
            <Link2 className="h-4 w-4 text-plum-500" /> Related Memories
          </div>
          <div className="flex flex-col gap-2">
            {related.map((e) => (
              <Link
                key={e._id}
                to={`/journal/${e._id}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-ink-50 dark:hover:bg-ink-800"
              >
                <span className="truncate text-sm text-ink-700 dark:text-ink-200">{e.title || "Untitled entry"}</span>
                <span className="shrink-0 text-xs text-ink-400">{format(new Date(e.entryDate), "MMM d, yyyy")}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link to="/journal" className="text-sm font-medium text-plum-600 hover:text-plum-500">
          ← Back to journal
        </Link>
      </div>
    </div>
  );
}

function AnalysisRow({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition hover:bg-ink-100 dark:hover:bg-ink-800 ${
        active ? "text-plum-600" : "text-ink-500"
      }`}
    >
      {children}
    </button>
  );
}
