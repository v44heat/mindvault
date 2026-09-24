import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { RichTextEditor } from "../components/RichTextEditor";
import { MOOD_META } from "../components/MoodBadge";
import * as journalApi from "../api/journal";
import type { EntryType, Mood } from "../types";

const ENTRY_TYPES: { value: EntryType; label: string }[] = [
  { value: "daily", label: "Daily Journal" },
  { value: "quick_note", label: "Quick Note" },
  { value: "gratitude", label: "Gratitude" },
  { value: "reflection", label: "Reflection" },
  { value: "idea", label: "Idea" },
  { value: "achievement", label: "Achievement" },
  { value: "memory", label: "Memory" },
  { value: "dream", label: "Dream" },
  { value: "goal_reflection", label: "Goal Reflection" },
];

const AUTOSAVE_DELAY_MS = 2000;

export function EntryEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["journal-entry", id],
    queryFn: () => journalApi.getEntry(id!),
    enabled: isEditing,
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("daily");
  const [mood, setMood] = useState<Mood | undefined>();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [entryId, setEntryId] = useState<string | undefined>(id);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (existing && !hasHydrated.current) {
      setTitle(existing.title);
      setContent(existing.content);
      setEntryType(existing.entryType);
      setMood(existing.mood);
      setTags(existing.tags);
      hasHydrated.current = true;
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { title, content, entryType, mood, tags };
      if (entryId) {
        return journalApi.updateEntry(entryId, payload);
      }
      const created = await journalApi.createEntry(payload);
      setEntryId(created._id);
      return created;
    },
    onSuccess: () => {
      setLastSavedAt(new Date());
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    },
  });

  // Auto-save shortly after the user stops typing.
  useEffect(() => {
    if (!hasHydrated.current && isEditing) return; // wait for existing entry to load
    if (!title && !content) return; // nothing to save yet

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveMutation.mutate();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, entryType, mood, tags]);

  const plainText = content.replace(/<[^>]*>/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  function addTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function handleDone() {
    saveMutation.mutate(undefined, {
      onSuccess: () => navigate(entryId ? `/journal/${entryId}` : "/journal"),
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between text-sm text-ink-400">
        <span>
          {saveMutation.isPending
            ? "Saving…"
            : lastSavedAt
            ? `Saved at ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Not saved yet"}
        </span>
        <button
          onClick={handleDone}
          className="rounded-full bg-plum-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-plum-500"
        >
          Done
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title"
        className="w-full bg-transparent text-3xl font-semibold text-ink-900 outline-none placeholder:text-ink-300 dark:text-ink-100 dark:placeholder:text-ink-700"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value as EntryType)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm dark:border-ink-800 dark:bg-ink-900"
        >
          {ENTRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {(Object.keys(MOOD_META) as Mood[]).map((m) => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? undefined : m)}
              title={MOOD_META[m].label}
              className={`rounded-lg px-2 py-1.5 text-lg transition ${
                mood === m ? "bg-plum-100 dark:bg-ink-800" : "hover:bg-ink-100 dark:hover:bg-ink-800"
              }`}
            >
              {MOOD_META[m].emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
        <span>
          {wordCount} words · {readingTime} min read
        </span>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-plum-100 px-2.5 py-1 text-xs text-plum-600 dark:bg-ink-800 dark:text-plum-300"
            >
              #{tag}
              <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag…"
            className="rounded-full border border-dashed border-ink-300 bg-transparent px-3 py-1 text-xs outline-none placeholder:text-ink-400 dark:border-ink-700"
          />
        </div>
      </div>
    </div>
  );
}
