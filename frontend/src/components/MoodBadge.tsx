import type { Mood } from "../types";

export const MOOD_META: Record<Mood, { emoji: string; label: string; color: string }> = {
  excellent: { emoji: "😄", label: "Excellent", color: "text-leaf-500" },
  good: { emoji: "🙂", label: "Good", color: "text-plum-500" },
  neutral: { emoji: "😐", label: "Neutral", color: "text-ink-500" },
  low: { emoji: "😔", label: "Low", color: "text-sun-500" },
  very_low: { emoji: "😞", label: "Very low", color: "text-red-500" },
};

export function MoodBadge({ mood }: { mood?: Mood }) {
  if (!mood) return null;
  const meta = MOOD_META[mood];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
