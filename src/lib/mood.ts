import type { JournalEntry, MoodScore } from "./types";

/**
 * Pure mood-analytics helpers. No I/O, no React — trivially unit-testable and
 * reusable on both client and server.
 */

/** Average mood across entries, or null when there is nothing to average. */
export function averageMood(entries: JournalEntry[]): number | null {
  if (entries.length === 0) return null;
  const sum = entries.reduce((acc, e) => acc + e.mood, 0);
  return Number((sum / entries.length).toFixed(2));
}

/**
 * Simple linear trend of mood over time. Returns "improving", "declining" or
 * "steady" by comparing the first and second half of the (chronological) window.
 * Deliberately conservative: needs at least 4 entries to call a direction.
 */
export function moodTrend(
  entries: JournalEntry[]
): "improving" | "declining" | "steady" | "insufficient" {
  if (entries.length < 4) return "insufficient";
  const sorted = [...entries].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
  const mid = Math.floor(sorted.length / 2);
  const first = averageMood(sorted.slice(0, mid));
  const second = averageMood(sorted.slice(mid));
  if (first === null || second === null) return "insufficient";
  const delta = second - first;
  if (delta >= 0.5) return "improving";
  if (delta <= -0.5) return "declining";
  return "steady";
}

/** Entries from the last `days` days, newest first. */
export function recentEntries(
  entries: JournalEntry[],
  days: number,
  now: Date = new Date()
): JournalEntry[] {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return entries
    .filter((e) => new Date(e.createdAt).getTime() >= cutoff)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Count how many distinct calendar days in a row end today have an entry. */
export function currentStreak(
  entries: JournalEntry[],
  now: Date = new Date()
): number {
  const days = new Set(
    entries.map((e) => new Date(e.createdAt).toISOString().slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date(now);
  // Walk backwards from today while each day has an entry.
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Tally tag frequency, most common first. */
export function topTags(
  entries: JournalEntry[],
  limit = 5
): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const tag of e.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function moodToScore(value: number): MoodScore {
  const clamped = Math.min(5, Math.max(1, Math.round(value)));
  return clamped as MoodScore;
}
