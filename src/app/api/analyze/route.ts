import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EXAMS, journalEntrySchema, insightSchema } from "@/lib/types";
import { buildInsightPrompt } from "@/lib/prompts";
import { generateInsight } from "@/lib/gemini";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const bodySchema = z.object({
  exam: z.enum(EXAMS),
  // Bounded to keep prompt size (and cost) predictable.
  entries: z.array(journalEntrySchema).min(1).max(60),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "analyze", 20)) {
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

  const { exam, entries } = parsed.data;
  const { system, user } = buildInsightPrompt(entries, exam);

  try {
    const raw = await generateInsight(system, user);
    // Validate the model's output before trusting it (defence in depth).
    const insight = insightSchema.safeParse(raw);
    if (!insight.success) {
      return NextResponse.json(
        { error: "The analysis came back malformed. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ insight: insight.data });
  } catch (err) {
    // Never leak internal errors (could contain the prompt/key context).
    console.error("analyze route error:", err);
    return NextResponse.json(
      { error: "Could not generate insights right now." },
      { status: 500 }
    );
  }
}
