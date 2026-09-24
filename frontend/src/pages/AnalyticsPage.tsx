import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import * as analyticsApi from "../api/analytics";
import type { AnalyticsRange } from "../api/analytics";
import { MOOD_META } from "../components/MoodBadge";
import type { Mood } from "../types";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
];

const MOOD_SCORE: Record<string, number> = { very_low: 1, low: 2, neutral: 3, good: 4, excellent: 5 };

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("30d");

  const { data: mood, isLoading: loadingMood } = useQuery({
    queryKey: ["analytics-mood", range],
    queryFn: () => analyticsApi.getMoodAnalytics(range),
  });

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ["analytics-activity", range],
    queryFn: () => analyticsApi.getActivityAnalytics(range),
  });

  const moodChartData = mood?.moodOverTime.map((m) => ({ date: m.date.slice(5), score: MOOD_SCORE[m.mood] ?? 3 })) ?? [];
  const entriesChartData = activity?.entriesOverTime.map((e) => ({ date: e.date.slice(5), entries: e.count })) ?? [];

  const isLoading = loadingMood || loadingActivity;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-100">Analytics</h1>
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                range === r.value
                  ? "bg-plum-600 text-white"
                  : "border border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Entries over time">
            {entriesChartData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={entriesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-200)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="entries" stroke="#8563e8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Mood trend">
            {moodChartData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={moodChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-200)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#e8a23a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Writing activity by day">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activity?.activityByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-200)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#a58af0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Most-used tags">
            {(mood?.topTags.length ?? 0) === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mood?.topTags} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-200)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="tag" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6d4dd6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Mood distribution">
            <div className="flex h-[220px] flex-col justify-center gap-3">
              {(["excellent", "good", "neutral", "low", "very_low"] as Mood[]).map((m) => {
                const count = mood?.moodDistribution.find((d) => d.mood === m)?.count ?? 0;
                const max = Math.max(1, ...(mood?.moodDistribution.map((d) => d.count) ?? [1]));
                return (
                  <div key={m} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-ink-500">
                      {MOOD_META[m].emoji} {MOOD_META[m].label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                      <div className="h-full rounded-full bg-plum-500" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs text-ink-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <ChartCard title="Entry types">
            {(mood?.entryTypes.length ?? 0) === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mood?.entryTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-200)" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4fa876" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">{title}</p>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-ink-400">
      Not enough data yet for this range.
    </div>
  );
}
