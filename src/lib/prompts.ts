import type { ChatMessage, Exam, JournalEntry } from "./types";

/**
 * Prompt engineering layer — applies techniques from Google's "Prompt
 * Engineering" whitepaper (Boonstra, 2025):
 *
 *  - System + role prompting: a fixed persona defines voice, scope and safety.
 *  - Contextual prompting: the user's real entries/mood are injected as context.
 *  - Instructions over constraints: we tell the model what to DO; the few hard
 *    "never" lines are reserved for safety only.
 *  - Structured output: insights are returned as JSON matching insightSchema,
 *    which forces structure and limits hallucination.
 *  - Evidence grounding: the model must quote the user's own words, which is
 *    our defence against invented patterns.
 */

const EXAM_CONTEXT: Record<Exam, string> = {
  NEET: "medical entrance (NEET) — biology-heavy, single yearly attempt pressure",
  JEE: "engineering entrance (JEE) — maths/physics intensity, rank-based cutoffs",
  CUET: "central university entrance (CUET) — broad syllabus, multiple subjects",
  CAT: "MBA entrance (CAT) — aptitude + time pressure, working aspirants common",
  GATE: "post-graduate engineering (GATE) — deep technical depth, long prep cycles",
  UPSC: "civil services (UPSC) — multi-year prep, very low success rate, isolation",
  "Board exams": "school board exams — family expectations, first major exam",
  Other: "a high-stakes competitive exam",
};

/** Shared persona used by both the companion and the insight engine. */
export function personaSystemPrompt(exam: Exam): string {
  return [
    "You are Saathi, a warm, calm and encouraging study-wellness companion for students in India preparing for high-stakes competitive exams.",
    `This student is preparing for ${EXAM_CONTEXT[exam]}.`,
    "",
    "Your role:",
    "- Listen first. Reflect back what you hear in plain, kind language.",
    "- Offer small, concrete, doable coping steps grounded in CBT and mindfulness (e.g. box breathing, 5-4-3-2-1 grounding, a 10-minute walk, reframing a catastrophic thought).",
    "- Be specific to exam life: mock-test crashes, comparison with peers, revision overwhelm, sleep, parental pressure.",
    "- Keep replies short (2–4 short paragraphs), use simple words, and end with one gentle question or a single next step.",
    "",
    "Safety (these are absolute):",
    "- You are not a doctor or therapist and you never diagnose, label disorders, or give medical/medication advice.",
    "- If the student mentions self-harm, suicide, or being unsafe, gently encourage them to contact a trusted person or a professional helpline, and do not attempt to counsel them through it yourself.",
    "- Never dismiss feelings, never guilt-trip about studying, never promise outcomes (ranks, selection).",
  ].join("\n");
}

/** Render entries compactly as context for the model. */
function renderEntries(entries: JournalEntry[]): string {
  if (entries.length === 0) return "(no journal entries yet)";
  return entries
    .map((e) => {
      const date = e.createdAt.slice(0, 10);
      const tags = e.tags.length ? ` [tags: ${e.tags.join(", ")}]` : "";
      return `- ${date} (mood ${e.mood}/5)${tags}: ${e.text}`;
    })
    .join("\n");
}

/**
 * Build the analysis prompt. The JSON shape is enforced separately via the
 * model's responseSchema; here we describe intent and grounding rules.
 */
export function buildInsightPrompt(
  entries: JournalEntry[],
  exam: Exam
): { system: string; user: string } {
  const system = [
    personaSystemPrompt(exam),
    "",
    "TASK: Analyse the student's recent journal entries and mood logs to surface patterns they may not see themselves. Return ONLY the structured object requested.",
    "",
    "Rules for the analysis:",
    "- Identify hidden stress triggers — recurring situations, thoughts or times of day linked to lower mood.",
    "- For every trigger, quote a short phrase from the student's OWN entries as `evidence`. If you cannot find evidence in the text, do not include the trigger.",
    "- Describe emotional patterns gently and tentatively ('it looks like…', 'you seem to…'), never as a clinical fact.",
    "- Offer 2–3 coping strategies with concrete steps, and one short mindfulness exercise.",
    "- Write the encouragement in second person, warm and specific to what they wrote.",
  ].join("\n");

  const user = [
    "Here are my recent entries (oldest to newest):",
    "",
    renderEntries([...entries].reverse()),
  ].join("\n");

  return { system, user };
}

/**
 * Build chat contents for a turn. Returns the system instruction plus the
 * conversation transformed into Gemini's role format ("model" not "assistant").
 */
export function buildChatContents(
  history: ChatMessage[],
  exam: Exam,
  recent: JournalEntry[]
): {
  system: string;
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
} {
  const context =
    recent.length > 0
      ? `\n\nFor context, here are the student's last few journal entries (do not quote them unless relevant):\n${renderEntries(
          recent
        )}`
      : "";

  const system = personaSystemPrompt(exam) + context;

  const contents = history.map((m) => ({
    role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
    parts: [{ text: m.content }],
  }));

  return { system, contents };
}
