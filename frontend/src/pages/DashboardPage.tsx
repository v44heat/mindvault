import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Mic, Sparkles, Flame, BookOpen, Type, Pin, CalendarClock } from "lucide-react";
import { getDashboardOverview, getOnThisDay } from "../api/journal";
import { useAuth } from "../context/AuthContext";
import { EntryCard } from "../components/EntryCard";
import { MOOD_META } from "../components/MoodBadge";
import type { Mood } from "../types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
  });
  const { data: onThisDay } = useQuery({
    queryKey: ["on-this-day"],
    queryFn: getOnThisDay,
  });

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-3xl bg-gradient-to-br from-plum-600 to-plum-500 p-6 text-white md:p-8">
        <p className="text-sm text-plum-100">{today}</p>
        <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
          {greeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-plum-100">How are you feeling today?</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/journal/new"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-plum-700 transition hover:bg-plum-50"
          >
            <Plus className="h-4 w-4" /> New Entry
          </Link>
          <button
            title="Voice journaling is coming in a future update"
            disabled
            className="flex items-center gap-2 rounded-full bg-plum-700/40 px-4 py-2 text-sm font-medium text-white/70 ring-1 ring-inset ring-white/20 cursor-not-allowed"
          >
            <Mic className="h-4 w-4" /> Voice
          </button>
          <Link
            to="/insights"
            className="flex items-center gap-2 rounded-full bg-plum-700/40 px-4 py-2 text-sm font-medium text-white ring-1 ring-inset ring-white/30 transition hover:bg-plum-700/60"
          >
            <Sparkles className="h-4 w-4" /> Ask AI
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Flame} label="Streak" value={isLoading ? "…" : `${data?.currentStreak ?? 0} days`} />
        <StatCard icon={BookOpen} label="Entries" value={isLoading ? "…" : String(data?.totalEntries ?? 0)} />
        <StatCard icon={Type} label="Words written" value={isLoading ? "…" : (data?.totalWords ?? 0).toLocaleString()} />
        <StatCard icon={Pin} label="This month" value={isLoading ? "…" : String(data?.entriesThisMonth ?? 0)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">Recent Entries</h2>
            <Link to="/journal" className="text-sm font-medium text-plum-600 hover:text-plum-500">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {isLoading && <SkeletonList />}
            {!isLoading && (data?.recentEntries.length ?? 0) === 0 && (
              <EmptyState />
            )}
            {data?.recentEntries.map((entry) => (
              <EntryCard key={entry._id} entry={entry} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
              <Sparkles className="h-4 w-4 text-plum-500" /> AI Insight
            </div>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Analyze a few more entries to unlock personal insights here — patterns MindVault notices
              in your own words, grounded in what you've actually written.
            </p>
            <Link to="/insights" className="mt-3 inline-block text-sm font-medium text-plum-600 hover:text-plum-500">
              Explore Insights →
            </Link>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
              <Pin className="h-4 w-4 text-plum-500" /> Pinned Memories
            </div>
            {(data?.pinnedEntries.length ?? 0) === 0 && !isLoading && (
              <p className="text-sm text-ink-400">Pin an entry to keep it close at hand.</p>
            )}
            <div className="flex flex-col gap-2">
              {data?.pinnedEntries.map((entry) => (
                <Link
                  key={entry._id}
                  to={`/journal/${entry._id}`}
                  className="block truncate rounded-lg px-2 py-1.5 text-sm text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                >
                  {entry.title || "Untitled entry"}
                </Link>
              ))}
            </div>
          </div>

          {onThisDay && onThisDay.entries.length > 0 && (
            <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
                <CalendarClock className="h-4 w-4 text-plum-500" /> On This Day
              </div>
              <div className="flex flex-col gap-3">
                {onThisDay.entries.slice(0, 3).map((entry) => {
                  const yearsAgo = new Date().getFullYear() - new Date(entry.entryDate).getFullYear();
                  return (
                    <Link key={entry._id} to={`/journal/${entry._id}`} className="block rounded-lg px-2 py-1.5 hover:bg-ink-50 dark:hover:bg-ink-800">
                      <p className="text-xs text-ink-400">
                        {yearsAgo} {yearsAgo === 1 ? "year" : "years"} ago
                        {entry.mood && <span className="ml-1">{MOOD_META[entry.mood as Mood]?.emoji}</span>}
                      </p>
                      <p className="truncate text-sm text-ink-700 dark:text-ink-200">{entry.title || "Untitled entry"}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <Icon className="h-4 w-4 text-plum-500" />
      <p className="mt-2 text-xl font-semibold text-ink-900 dark:text-ink-100">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 p-8 text-center dark:border-ink-800">
      <p className="text-sm text-ink-500 dark:text-ink-400">
        No entries yet. Your first one is a click away.
      </p>
      <Link
        to="/journal/new"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-plum-600 px-4 py-2 text-sm font-semibold text-white hover:bg-plum-500"
      >
        <Plus className="h-4 w-4" /> Write your first entry
      </Link>
    </div>
  );
}
