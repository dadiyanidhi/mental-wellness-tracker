"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { CrisisBanner } from "@/components/CrisisBanner";
import { recentEntries } from "@/lib/mood";
import { screenForCrisis } from "@/lib/crisis";
import type { ChatMessage } from "@/lib/types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I'm Saathi. Think of me as a study buddy who's here whenever the pressure builds up. How are you doing right now?",
};

export function Companion() {
  const { entries, exam } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view after each turn.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setError(null);
    setLoading(true);

    // Client-side pre-screen for instant resource surfacing.
    if (screenForCrisis(content).level === "acute") setShowCrisis(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam,
          history,
          recent: recentEntries(entries, 7).slice(0, 5),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.crisisLevel === "acute" || data.crisisLevel === "elevated") {
        setShowCrisis(true);
      }
      setMessages([...history, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {showCrisis && <CrisisBanner />}

      {/* Live region so screen-reader users hear new replies. */}
      <div
        ref={logRef}
        role="log"
        aria-label="Conversation with Saathi"
        aria-live="polite"
        className="h-[55vh] space-y-3 overflow-y-auto rounded-lg border border-border bg-bg p-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 ${
                m.role === "user"
                  ? "bg-primary text-primary-fg"
                  : "bg-surface border border-border"
              }`}
            >
              <span className="sr-only">
                {m.role === "user" ? "You said: " : "Saathi said: "}
              </span>
              {m.content}
            </p>
          </div>
        ))}
        {loading && (
          <p className="text-sm text-muted" aria-live="polite">
            Saathi is typing…
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}

      <form onSubmit={send} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Type a message to Saathi
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me how you're feeling…"
          maxLength={4000}
          autoComplete="off"
          className="flex-1 rounded-lg border border-border bg-surface p-3"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-fg disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
