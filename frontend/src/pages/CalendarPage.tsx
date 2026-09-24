import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Pin } from "lucide-react";
import * as journalApi from "../api/journal";
import { MOOD_META } from "../components/MoodBadge";
import type { Mood } from "../types";

const MOOD_ORDER: Mood[] = ["very_low", "low", "neutral", "good", "excellent"];

function dominantMood(moods: string[]): Mood | undefined {
  if (moods.length === 0) return undefined;
  // Pick the highest-scoring mood present that day, so a mixed day still reads positively.
  for (let i = MOOD_ORDER.length - 1; i >= 0; i--) {
    if (moods.includes(MOOD_ORDER[i])) return MOOD_ORDER[i];
  }
  return undefined;
}

function heatColor(count: number): string {
  if (count === 0) return "bg-ink-100 dark:bg-ink-800";
  if (count === 1) return "bg-plum-200 dark:bg-plum-900";
  if (count === 2) return "bg-plum-400 dark:bg-plum-700";
  return "bg-plum-600 dark:bg-plum-500";
}

export function CalendarPage() {
  const [tab, setTab] = useState<"calendar" | "timeline">("calendar");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;

  const { data: calendar, isLoading: loadingCalendar } = useQuery({
    queryKey: ["calendar", year, month],
    queryFn: () => journalApi.getCalendarMonth(year, month),
    enabled: tab === "calendar",
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ["timeline"],
    queryFn: journalApi.getTimeline,
    enabled: tab === "timeline",
  });

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const leadingBlanks = useMemo(() => getDay(startOfMonth(cursor)), [cursor]);

  const groupedTimeline = useMemo(() => {
    if (!timeline) return [];
    const groups: { label: string; entries: typeof timeline.entries }[] = [];
    for (const entry of timeline.entries) {
      const label = format(new Date(entry.entryDate), "MMMM yyyy");
      const group = groups.find((g) => g.label === label);
      if (group) group.entries.push(entry);
      else groups.push({ label, entries: [entry] });
    }
    return groups;
  }, [timeline]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-100">Calendar & Timeline</h1>
        <div className="flex rounded-xl border border-ink-200 p-1 dark:border-ink-800">
          <TabButton active={tab === "calendar"} onClick={() => setTab("calendar")}>
            Calendar
          </TabButton>
          <TabButton active={tab === "timeline"} onClick={() => setTab("timeline")}>
            Timeline
          </TabButton>
        </div>
      </div>

      {tab === "calendar" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setCursor((c) => subMonths(c, 1))}
              className="rounded-lg p-2 hover:bg-ink-100 dark:hover:bg-ink-800"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-ink-900 dark:text-ink-100">{format(cursor, "MMMM yyyy")}</span>
            <button
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="rounded-lg p-2 hover:bg-ink-100 dark:hover:bg-ink-800"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs text-ink-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {loadingCalendar &&
              Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />
              ))}

            {!loadingCalendar && (
              <>
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {daysInMonth.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const info = calendar?.days[key];
                  const mood = info ? dominantMood(info.moods) : undefined;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDay(info ? key : null)}
                      className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ${heatColor(
                        info?.count ?? 0
                      )} ${info ? "cursor-pointer" : "cursor-default"} ${
                        selectedDay === key ? "ring-2 ring-plum-500" : ""
                      }`}
                    >
                      <span className={info?.count ? "font-medium text-white" : "text-ink-500 dark:text-ink-400"}>
                        {day.getDate()}
                      </span>
                      {mood && <span className="absolute bottom-1 text-[10px]">{MOOD_META[mood].emoji}</span>}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {selectedDay && calendar?.days[selectedDay] && (
            <div className="mt-6 rounded-2xl border border-ink-200 p-4 dark:border-ink-800">
              <p className="mb-2 text-sm font-medium text-ink-900 dark:text-ink-100">
                {format(new Date(selectedDay), "EEEE, MMMM d")} · {calendar.days[selectedDay].count}{" "}
                {calendar.days[selectedDay].count === 1 ? "entry" : "entries"}
              </p>
              <div className="flex flex-col gap-1">
                {calendar.days[selectedDay].entryIds.map((id) => (
                  <Link key={id} to={`/journal/${id}`} className="text-sm text-plum-600 hover:text-plum-500">
                    View entry →
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "timeline" && (
        <div>
          {loadingTimeline && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />
              ))}
            </div>
          )}

          {!loadingTimeline && groupedTimeline.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-800">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Your timeline will fill in as you write more entries.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-8">
            {groupedTimeline.map((group) => (
              <div key={group.label}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{group.label}</h2>
                <div className="relative flex flex-col gap-4 border-l border-ink-200 pl-5 dark:border-ink-800">
                  {group.entries.map((entry) => (
                    <Link
                      key={entry._id}
                      to={`/journal/${entry._id}`}
                      className="relative block rounded-xl p-2 -ml-2 hover:bg-ink-50 dark:hover:bg-ink-900"
                    >
                      <span className="absolute -left-[26px] top-3 h-2.5 w-2.5 rounded-full bg-plum-500" />
                      <div className="flex items-center gap-2 text-xs text-ink-400">
                        <span>{format(new Date(entry.entryDate), "MMM d")}</span>
                        {entry.mood && <span>{MOOD_META[entry.mood as Mood]?.emoji}</span>}
                        {entry.isImportantMemory && <Pin className="h-3 w-3 text-plum-500" />}
                      </div>
                      <p className="text-sm font-medium text-ink-900 dark:text-ink-100">
                        {entry.title || "Untitled entry"}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-plum-600 text-white" : "text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
      }`}
    >
      {children}
    </button>
  );
}
