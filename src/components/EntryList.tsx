"use client";

import { useApp } from "@/components/AppProvider";
import { MOOD_META } from "@/lib/types";

export function EntryList() {
  const { entries, setEntries } = useApp();

  if (entries.length === 0) {
    return (
      <p className="text-muted">
        No entries yet. Your past reflections will appear here.
      </p>
    );
  }

  return (
    <ul role="list" className="space-y-3">
      {entries.map((entry) => {
        const meta = MOOD_META[entry.mood];
        const date = new Date(entry.createdAt).toLocaleString();
        return (
          <li
            key={entry.id}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  <span aria-hidden="true" className="mr-1 text-xl">
                    {meta.emoji}
                  </span>
                  <span className="sr-only">Mood: </span>
                  {meta.label}
                </p>
                <p className="text-sm text-muted">
                  <time dateTime={entry.createdAt}>{date}</time>
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEntries(entries.filter((e) => e.id !== entry.id))
                }
                className="rounded-md border border-border px-2 py-1 text-sm"
                aria-label={`Delete entry from ${date}`}
              >
                Delete
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap">{entry.text}</p>
            {entry.tags.length > 0 && (
              <ul role="list" className="mt-2 flex flex-wrap gap-2">
                {entry.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-full bg-bg px-2.5 py-0.5 text-xs text-muted"
                  >
                    #{t}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
