"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { MoodPicker } from "@/components/MoodPicker";
import { CrisisBanner } from "@/components/CrisisBanner";
import { newId } from "@/lib/storage";
import { screenForCrisis } from "@/lib/crisis";
import type { JournalEntry, MoodScore } from "@/lib/types";

const MAX_TEXT = 5000;

export function JournalForm() {
  const { entries, setEntries } = useApp();
  const [mood, setMood] = useState<MoodScore | null>(null);
  const [text, setText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 12) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (mood === null) {
      setError("Please choose a mood so we can track how you feel.");
      return;
    }
    if (text.trim().length === 0) {
      setError("Write a few words about your day before saving.");
      return;
    }
    setError(null);

    // Gentle, immediate safety check on what they just wrote.
    if (screenForCrisis(text).level === "acute") {
      setShowCrisis(true);
    }

    const entry: JournalEntry = {
      id: newId(),
      createdAt: new Date().toISOString(),
      mood,
      text: text.slice(0, MAX_TEXT),
      tags,
    };
    setEntries([entry, ...entries]);

    // Reset for the next entry.
    setMood(null);
    setText("");
    setTags([]);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <MoodPicker value={mood} onChange={setMood} />

      <div>
        <label htmlFor="entry-text" className="mb-1 block font-medium">
          What&apos;s on your mind today?
        </label>
        <p id="entry-hint" className="mb-2 text-sm text-muted">
          Write freely — about studying, sleep, pressure, anything. The more
          honest, the more useful your insights.
        </p>
        <textarea
          id="entry-text"
          aria-describedby="entry-hint entry-count"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_TEXT}
          rows={6}
          className="w-full rounded-lg border border-border bg-surface p-3"
        />
        <p id="entry-count" className="mt-1 text-right text-xs text-muted">
          {text.length} / {MAX_TEXT}
        </p>
      </div>

      <div>
        <label htmlFor="tag-input" className="mb-1 block font-medium">
          Tags <span className="text-muted">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            id="tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="e.g. mock test, sleep"
            className="flex-1 rounded-lg border border-border bg-surface p-2"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg border border-border px-3 py-2"
          >
            Add tag
          </button>
        </div>
        {tags.length > 0 && (
          <ul role="list" className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="rounded-full border border-border bg-bg px-3 py-1 text-sm"
                  aria-label={`Remove tag ${t}`}
                >
                  {t} ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}

      {/* Polite live region announces a successful save to screen readers. */}
      <p aria-live="polite" className="text-sm text-primary">
        {saved ? "Saved. Take a breath — you showed up today." : ""}
      </p>

      <button
        type="submit"
        className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-fg"
      >
        Save entry
      </button>

      {showCrisis && (
        <div className="mt-4">
          <CrisisBanner />
        </div>
      )}
    </form>
  );
}
