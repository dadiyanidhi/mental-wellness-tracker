"use client";

import { MOOD_META, MOOD_SCALE, type MoodScore } from "@/lib/types";

interface MoodPickerProps {
  value: MoodScore | null;
  onChange: (mood: MoodScore) => void;
  /** Accessible group label. */
  label?: string;
}

/**
 * Mood selector implemented as a radiogroup so it is fully keyboard- and
 * screen-reader-operable (arrow keys move between options via native radios).
 */
export function MoodPicker({
  value,
  onChange,
  label = "How are you feeling?",
}: MoodPickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{label}</legend>
      <div role="radiogroup" className="flex gap-2">
        {MOOD_SCALE.map((score) => {
          const meta = MOOD_META[score];
          const selected = value === score;
          return (
            <label
              key={score}
              className={`flex cursor-pointer flex-col items-center rounded-lg border px-3 py-2 text-sm ${
                selected
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-surface"
              }`}
            >
              <input
                type="radio"
                name="mood"
                className="sr-only"
                checked={selected}
                onChange={() => onChange(score)}
              />
              <span aria-hidden="true" className="text-2xl">
                {meta.emoji}
              </span>
              <span>{meta.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
