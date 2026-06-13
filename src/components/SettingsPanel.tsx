"use client";

import { useApp } from "@/components/AppProvider";
import { EXAMS, type Exam } from "@/lib/types";
import { exportEntries } from "@/lib/storage";

export function SettingsPanel() {
  const { exam, setExam, prefs, setPrefs, entries, setEntries } = useApp();

  function download() {
    const blob = new Blob([exportEntries()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saathi-journal-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function wipe() {
    if (
      confirm(
        "This permanently deletes every journal entry on this device. Continue?"
      )
    ) {
      setEntries([]);
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="exam-h" className="space-y-2">
        <h2 id="exam-h" className="text-xl font-bold">
          Your exam
        </h2>
        <label htmlFor="exam-select" className="block text-sm text-muted">
          We tailor support to your exam&apos;s pressures.
        </label>
        <select
          id="exam-select"
          value={exam}
          onChange={(e) => setExam(e.target.value as Exam)}
          className="rounded-lg border border-border bg-surface p-2"
        >
          {EXAMS.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      </section>

      <section aria-labelledby="a11y-h" className="space-y-3">
        <h2 id="a11y-h" className="text-xl font-bold">
          Accessibility
        </h2>

        <Toggle
          label="High-contrast theme"
          description="Stronger colour contrast for low-vision users."
          checked={prefs.highContrast}
          onChange={(v) => setPrefs({ ...prefs, highContrast: v })}
        />
        <Toggle
          label="Dyslexia-friendly text"
          description="Wider spacing and a more readable font."
          checked={prefs.dyslexiaFont}
          onChange={(v) => setPrefs({ ...prefs, dyslexiaFont: v })}
        />
        <Toggle
          label="Reduce motion"
          description="Minimise animations and transitions."
          checked={prefs.reduceMotion}
          onChange={(v) => setPrefs({ ...prefs, reduceMotion: v })}
        />

        <div>
          <label htmlFor="text-scale" className="block font-medium">
            Text size: {Math.round(prefs.textScale * 100)}%
          </label>
          <input
            id="text-scale"
            type="range"
            min={0.8}
            max={1.6}
            step={0.1}
            value={prefs.textScale}
            onChange={(e) =>
              setPrefs({ ...prefs, textScale: Number(e.target.value) })
            }
            className="w-full max-w-xs"
          />
        </div>
      </section>

      <section aria-labelledby="data-h" className="space-y-3">
        <h2 id="data-h" className="text-xl font-bold">
          Your data
        </h2>
        <p className="text-sm text-muted">
          Everything you write stays on this device. {entries.length}{" "}
          {entries.length === 1 ? "entry" : "entries"} stored locally.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            className="rounded-lg border border-border px-4 py-2 font-medium"
          >
            Export my data (JSON)
          </button>
          <button
            type="button"
            onClick={wipe}
            className="rounded-lg border-2 border-danger px-4 py-2 font-medium text-danger"
          >
            Delete everything
          </button>
        </div>
      </section>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5"
      />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-muted">{description}</span>
      </span>
    </label>
  );
}
