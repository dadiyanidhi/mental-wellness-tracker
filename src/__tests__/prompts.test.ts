import { describe, it, expect } from "vitest";
import { buildInsightPrompt, buildChatContents } from "@/lib/prompts";
import type { ChatMessage, JournalEntry } from "@/lib/types";

const entries: JournalEntry[] = [
  {
    id: "1",
    createdAt: "2026-06-10T09:00:00Z",
    mood: 2,
    text: "Bombed my JEE mock test, feel like everyone is ahead of me.",
    tags: ["mock test"],
  },
  {
    id: "2",
    createdAt: "2026-06-11T09:00:00Z",
    mood: 3,
    text: "Slept badly, couldn't focus on organic chemistry.",
    tags: ["sleep"],
  },
];

describe("buildInsightPrompt", () => {
  it("injects the exam context into the system prompt", () => {
    const { system } = buildInsightPrompt(entries, "JEE");
    expect(system).toContain("JEE");
    expect(system.toLowerCase()).toContain("evidence");
  });

  it("includes the user's own entries in the user prompt", () => {
    const { user } = buildInsightPrompt(entries, "JEE");
    expect(user).toContain("Bombed my JEE mock test");
    expect(user).toContain("mood 2/5");
  });

  it("forbids ungrounded triggers (instructions over constraints)", () => {
    const { system } = buildInsightPrompt(entries, "JEE");
    expect(system).toMatch(/quote a short phrase/i);
  });
});

describe("buildChatContents", () => {
  it("maps assistant role to Gemini's 'model' role", () => {
    const history: ChatMessage[] = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ];
    const { contents } = buildChatContents(history, "UPSC", []);
    expect(contents[0]?.role).toBe("user");
    expect(contents[1]?.role).toBe("model");
  });

  it("adds recent-entry context only when entries exist", () => {
    const withCtx = buildChatContents(
      [{ role: "user", content: "hi" }],
      "NEET",
      entries
    );
    expect(withCtx.system).toContain("journal entries");

    const without = buildChatContents(
      [{ role: "user", content: "hi" }],
      "NEET",
      []
    );
    expect(without.system).not.toContain("last few journal entries");
  });

  it("always carries the safety instructions in the persona", () => {
    const { system } = buildChatContents(
      [{ role: "user", content: "hi" }],
      "CAT",
      []
    );
    expect(system.toLowerCase()).toContain("never diagnose");
  });
});
