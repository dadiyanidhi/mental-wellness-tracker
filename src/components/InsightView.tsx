"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { recentEntries, averageMood, moodTrend } from "@/lib/mood";
import type { Insight } from "@/lib/types";

const TREND_LABEL: Record<ReturnType<typeof moodTrend>, string> = {
  improving: "trending up 🌤️",
  declining: "trending down — be gentle with yourself",
  steady: "fairly steady",
  insufficient: "needs a few more entries to read",
};

export function InsightView() {
  const { entries, exam } = useApp();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const window = recentEntries(entries, 14);
  const avg = averageMood(window);
  const trend = moodTrend(window);

  async function analyse() {
    setLoading(true);
    setError(null);
    setInsight(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, entries: window }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setInsight(data.insight as Insight);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Mood summary"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <Stat label="Entries (14 days)" value={String(window.length)} />
        <Stat
          label="Average mood"
          value={avg !== null ? `${avg} / 5` : "—"}
        />
        <Stat label="Trend" value={TREND_LABEL[trend]} />
      </section>

      {window.length === 0 ? (
        <p className="text-muted">
          Write a journal entry first — insights are built from your own words.
        </p>
      ) : (
        <button
          type="button"
          onClick={analyse}
          disabled={loading}
          aria-busy={loading}
          className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-fg disabled:opacity-60"
        >
          {loading ? "Reading your entries…" : "Generate my insights"}
        </button>
      )}

      <p aria-live="polite" className="sr-only">
        {loading ? "Generating insights, please wait." : ""}
      </p>

      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}

      {insight && <InsightResult insight={insight} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function InsightResult({ insight }: { insight: Insight }) {
  return (
    <article className="space-y-6">
      <section aria-labelledby="sum-h">
        <h2 id="sum-h" className="text-xl font-bold">
          What I noticed
        </h2>
        <p className="mt-1">{insight.summary}</p>
      </section>

      {insight.triggers.length > 0 && (
        <section aria-labelledby="trig-h">
          <h2 id="trig-h" className="text-xl font-bold">
            Possible stress triggers
          </h2>
          <ul role="list" className="mt-2 space-y-2">
            {insight.triggers.map((t, i) => (
              <li
                key={i}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <p className="font-medium">{t.label}</p>
                <blockquote className="mt-1 border-l-2 border-border pl-3 text-sm italic text-muted">
                  “{t.evidence}”
                </blockquote>
              </li>
            ))}
          </ul>
        </section>
      )}

      {insight.patterns.length > 0 && (
        <section aria-labelledby="pat-h">
          <h2 id="pat-h" className="text-xl font-bold">
            Patterns
          </h2>
          <ul role="list" className="mt-2 list-disc space-y-1 pl-5">
            {insight.patterns.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="cope-h">
        <h2 id="cope-h" className="text-xl font-bold">
          Things that might help
        </h2>
        <ul role="list" className="mt-2 space-y-3">
          {insight.copingStrategies.map((c, i) => (
            <li
              key={i}
              className="rounded-lg border border-border bg-surface p-3"
            >
              <p className="font-medium">{c.title}</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
                {c.steps.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="mind-h"
        className="rounded-lg border border-primary bg-surface p-4"
      >
        <h2 id="mind-h" className="text-xl font-bold">
          {insight.mindfulnessExercise.title}
          <span className="ml-2 text-sm font-normal text-muted">
            ~{insight.mindfulnessExercise.durationMinutes} min
          </span>
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {insight.mindfulnessExercise.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      <p className="rounded-lg bg-bg p-4 font-medium">
        💛 {insight.encouragement}
      </p>

      <p className="text-xs text-muted">
        These reflections are generated by AI from your entries to help you
        notice things — they are not a diagnosis or medical advice.
      </p>
    </article>
  );
}
