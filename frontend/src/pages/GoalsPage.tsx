import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Trash2, Sparkles, Loader2, Check } from "lucide-react";
import * as goalsApi from "../api/goals";

export function GoalsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.listGoals(),
  });

  const createMutation = useMutation({
    mutationFn: goalsApi.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setTitle("");
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: goalsApi.deleteGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) =>
      goalsApi.toggleMilestone(goalId, milestoneId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const addMilestoneMutation = useMutation({
    mutationFn: ({ goalId, title }: { goalId: string; title: string }) => goalsApi.addMilestone(goalId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({ title: title.trim() });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-100">Goals</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-plum-600 px-4 py-2 text-sm font-semibold text-white hover:bg-plum-500"
        >
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 flex gap-2 rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build my portfolio"
            className="flex-1 rounded-xl border border-ink-200 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100 dark:border-ink-700 dark:focus:ring-ink-800"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim()}
            className="rounded-xl bg-plum-600 px-4 py-2 text-sm font-semibold text-white hover:bg-plum-500 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />
          ))}
        </div>
      )}

      {!isLoading && (goals?.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-800">
          <p className="text-sm text-ink-500 dark:text-ink-400">No goals yet. What are you working toward?</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {goals?.map((goal) => (
          <div key={goal._id} className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 shrink-0 text-plum-500" />
                  <p className="truncate font-medium text-ink-900 dark:text-ink-100">{goal.title}</p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                  <div className="h-full rounded-full bg-plum-500 transition-all" style={{ width: `${goal.progress}%` }} />
                </div>
                <p className="mt-1 text-xs text-ink-400">{goal.progress}% complete</p>
              </div>
              <button
                title="Delete goal"
                onClick={() => {
                  if (confirm("Delete this goal?")) deleteMutation.mutate(goal._id);
                }}
                className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {goal.milestones.length > 0 && (
              <ul className="mt-4 flex flex-col gap-1.5">
                {goal.milestones.map((m) => (
                  <li key={m._id}>
                    <button
                      onClick={() => toggleMilestoneMutation.mutate({ goalId: goal._id, milestoneId: m._id })}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-ink-50 dark:hover:bg-ink-800"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          m.completed ? "border-plum-600 bg-plum-600 text-white" : "border-ink-300 dark:border-ink-600"
                        }`}
                      >
                        {m.completed && <Check className="h-3 w-3" />}
                      </span>
                      <span className={m.completed ? "text-ink-400 line-through" : "text-ink-700 dark:text-ink-200"}>
                        {m.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <MilestoneAdder
              onAdd={(t) => addMilestoneMutation.mutate({ goalId: goal._id, title: t })}
              pending={addMilestoneMutation.isPending}
            />

            <RelatedEntries goalId={goal._id} expanded={expandedId === goal._id} onToggle={() => setExpandedId(expandedId === goal._id ? null : goal._id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MilestoneAdder({ onAdd, pending }: { onAdd: (title: string) => void; pending: boolean }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue("");
      }}
      className="mt-2 flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a milestone…"
        className="flex-1 rounded-lg border border-dashed border-ink-300 bg-transparent px-2.5 py-1.5 text-xs outline-none placeholder:text-ink-400 dark:border-ink-700"
      />
      <button type="submit" disabled={pending || !value.trim()} className="text-xs font-medium text-plum-600 hover:text-plum-500 disabled:opacity-50">
        Add
      </button>
    </form>
  );
}

function RelatedEntries({ goalId, expanded, onToggle }: { goalId: string; expanded: boolean; onToggle: () => void }) {
  const { data, isLoading, isError, error, refetch, isFetched } = useQuery({
    queryKey: ["goal-related-entries", goalId],
    queryFn: () => goalsApi.getRelatedEntries(goalId),
    enabled: false,
  });

  return (
    <div className="mt-3 border-t border-ink-100 pt-3 dark:border-ink-800">
      <button
        onClick={() => {
          onToggle();
          if (!isFetched) refetch();
        }}
        className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-plum-600"
      >
        <Sparkles className="h-3.5 w-3.5" /> Related journal entries
      </button>

      {expanded && (
        <div className="mt-2">
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />}
          {isError && (
            <p className="text-xs text-red-500">{(error as any)?.response?.data?.message ?? "Couldn't load related entries."}</p>
          )}
          {data && data.length === 0 && <p className="text-xs text-ink-400">No related entries found yet.</p>}
          <div className="flex flex-wrap gap-1.5">
            {data?.map((e) => (
              <Link
                key={e._id}
                to={`/journal/${e._id}`}
                className="rounded-full bg-plum-100 px-2.5 py-1 text-xs text-plum-600 hover:bg-plum-200 dark:bg-ink-800 dark:text-plum-300"
              >
                {e.title || "Untitled entry"}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
