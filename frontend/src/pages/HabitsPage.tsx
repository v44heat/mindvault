import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Flame, Archive, Trash2, Check } from "lucide-react";
import * as habitsApi from "../api/habits";

const EMOJI_OPTIONS = ["✅", "📖", "💻", "🏃", "🧘", "🎯", "✍️", "💧"];

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function HabitsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(EMOJI_OPTIONS[0]);
  const [showForm, setShowForm] = useState(false);

  const { data: habits, isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: habitsApi.listHabits,
  });

  const createMutation = useMutation({
    mutationFn: habitsApi.createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setName("");
      setShowForm(false);
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => habitsApi.checkInHabit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  const archiveMutation = useMutation({
    mutationFn: habitsApi.archiveHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: habitsApi.deleteHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), icon });
  }

  const today = todayKey();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-100">Habits</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-plum-600 px-4 py-2 text-sm font-semibold text-white hover:bg-plum-500"
        >
          <Plus className="h-4 w-4" /> New Habit
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div className="flex flex-wrap items-center gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setIcon(e)}
                className={`rounded-lg px-2.5 py-1.5 text-lg ${icon === e ? "bg-plum-100 dark:bg-ink-800" : "hover:bg-ink-100 dark:hover:bg-ink-800"}`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read, Code, Exercise…"
              className="flex-1 rounded-xl border border-ink-200 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100 dark:border-ink-700 dark:focus:ring-ink-800"
            />
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="rounded-xl bg-plum-600 px-4 py-2 text-sm font-semibold text-white hover:bg-plum-500 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />
          ))}
        </div>
      )}

      {!isLoading && (habits?.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-800">
          <p className="text-sm text-ink-500 dark:text-ink-400">No habits yet. Add one to start tracking.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {habits?.map(({ habit, stats }) => {
          const checkedToday = habit.checkIns.includes(today);
          return (
            <div
              key={habit._id}
              className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
            >
              <button
                onClick={() => checkInMutation.mutate(habit._id)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition ${
                  checkedToday ? "bg-plum-600 text-white" : "bg-ink-100 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700"
                }`}
                title={checkedToday ? "Checked in today" : "Check in for today"}
              >
                {checkedToday ? <Check className="h-5 w-5" /> : habit.icon}
              </button>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 dark:text-ink-100">{habit.name}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-ink-400">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-sun-500" /> {stats.currentStreak} day streak
                  </span>
                  <span>Longest: {stats.longestStreak}</span>
                  <span>Last 30d: {Math.round(stats.last30DaysRate * 100)}%</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  title="Archive"
                  onClick={() => archiveMutation.mutate(habit._id)}
                  className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  <Archive className="h-4 w-4" />
                </button>
                <button
                  title="Delete"
                  onClick={() => {
                    if (confirm("Delete this habit? This can't be undone.")) deleteMutation.mutate(habit._id);
                  }}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
