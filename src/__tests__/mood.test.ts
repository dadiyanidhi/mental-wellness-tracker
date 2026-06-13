import { describe, it, expect } from "vitest";
import {
  averageMood,
  moodTrend,
  recentEntries,
  currentStreak,
  topTags,
  moodToScore,
} from "@/lib/mood";
import type { JournalEntry, MoodScore } from "@/lib/types";

function entry(
  daysAgo: number,
  mood: MoodScore,
  tags: string[] = [],
  now = new Date("2026-06-13T12:00:00Z")
): JournalEntry {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `e-${daysAgo}-${mood}`,
    createdAt: d.toISOString(),
    mood,
    text: "test",
    tags,
  };
}

const NOW = new Date("2026-06-13T12:00:00Z");

describe("averageMood", () => {
  it("returns null with no entries", () => {
    expect(averageMood([])).toBeNull();
  });
  it("averages and rounds to 2 dp", () => {
    expect(averageMood([entry(0, 4), entry(1, 1), entry(2, 4)])).toBe(3);
  });
});

describe("moodTrend", () => {
  it("needs at least 4 entries", () => {
    expect(moodTrend([entry(0, 1), entry(1, 2), entry(2, 3)])).toBe(
      "insufficient"
    );
  });
  it("detects improvement (older low, newer high)", () => {
    const e = [entry(3, 1), entry(2, 2), entry(1, 4), entry(0, 5)];
    expect(moodTrend(e)).toBe("improving");
  });
  it("detects decline", () => {
    const e = [entry(3, 5), entry(2, 4), entry(1, 2), entry(0, 1)];
    expect(moodTrend(e)).toBe("declining");
  });
  it("detects steady", () => {
    const e = [entry(3, 3), entry(2, 3), entry(1, 3), entry(0, 3)];
    expect(moodTrend(e)).toBe("steady");
  });
});

describe("recentEntries", () => {
  it("keeps only entries within the window, newest first", () => {
    const all = [entry(0, 5), entry(2, 4), entry(10, 3)];
    const recent = recentEntries(all, 7, NOW);
    expect(recent).toHaveLength(2);
    expect(recent[0]?.mood).toBe(5);
  });
});

describe("currentStreak", () => {
  it("counts consecutive days ending today", () => {
    const all = [entry(0, 4), entry(1, 4), entry(2, 4)];
    expect(currentStreak(all, NOW)).toBe(3);
  });
  it("breaks the streak on a gap", () => {
    const all = [entry(0, 4), entry(2, 4)];
    expect(currentStreak(all, NOW)).toBe(1);
  });
  it("is zero when today has no entry", () => {
    const all = [entry(1, 4), entry(2, 4)];
    expect(currentStreak(all, NOW)).toBe(0);
  });
});

describe("topTags", () => {
  it("ranks tags by frequency", () => {
    const all = [
      entry(0, 3, ["sleep", "mock test"]),
      entry(1, 3, ["sleep"]),
      entry(2, 3, ["sleep", "mock test"]),
    ];
    const top = topTags(all);
    expect(top[0]).toEqual({ tag: "sleep", count: 3 });
    expect(top[1]).toEqual({ tag: "mock test", count: 2 });
  });
});

describe("moodToScore", () => {
  it("clamps and rounds into 1..5", () => {
    expect(moodToScore(0)).toBe(1);
    expect(moodToScore(9)).toBe(5);
    expect(moodToScore(3.4)).toBe(3);
  });
});
