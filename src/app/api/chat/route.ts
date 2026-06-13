import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EXAMS, chatMessageSchema, journalEntrySchema } from "@/lib/types";
import { buildChatContents } from "@/lib/prompts";
import { generateChatReply } from "@/lib/gemini";
import { screenForCrisis, CRISIS_MESSAGE } from "@/lib/crisis";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const bodySchema = z.object({
  exam: z.enum(EXAMS),
  history: z.array(chatMessageSchema).min(1).max(40),
  // A small, optional context window of recent entries.
  recent: z.array(journalEntrySchema).max(10).default([]),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "chat", 30)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { exam, history, recent } = parsed.data;
  const lastUser = [...history].reverse().find((m) => m.role === "user");

  // SAFETY GATE — runs before the model. On acute signals we do not let the
  // LLM improvise; we return a reviewed, safe message plus a flag that tells
  // the client to surface helplines.
  const signal = lastUser
    ? screenForCrisis(lastUser.content)
    : { level: "none" as const, matched: [] };

  if (signal.level === "acute") {
    return NextResponse.json({
      reply: CRISIS_MESSAGE,
      crisisLevel: "acute",
    });
  }

  try {
    const { system, contents } = buildChatContents(history, exam, recent);
    const reply = await generateChatReply(system, contents);
    return NextResponse.json({ reply, crisisLevel: signal.level });
  } catch (err) {
    console.error("chat route error:", err);
    return NextResponse.json(
      { error: "Could not reach the companion right now." },
      { status: 500 }
    );
  }
}
