import { z } from "zod";

/**
 * Domain types for Saathi. Zod schemas double as runtime validators for the
 * API boundary (security: never trust client input) and as the single source
 * of truth for TypeScript types (code quality: no drift between the two).
 */

export const EXAMS = [
  "NEET",
  "JEE",
  "CUET",
  "CAT",
  "GATE",
  "UPSC",
  "Board exams",
  "Other",
] as const;
export type Exam = (typeof EXAMS)[number];

/** Five-point mood scale. 1 = very low, 5 = very good. */
export const MOOD_SCALE = [1, 2, 3, 4, 5] as const;
export type MoodScore = (typeof MOOD_SCALE)[number];

export const MOOD_META: Record<MoodScore, { label: string; emoji: string }> = {
  1: { label: "Very low", emoji: "😞" },
  2: { label: "Low", emoji: "🙁" },
  3: { label: "Okay", emoji: "😐" },
  4: { label: "Good", emoji: "🙂" },
  5: { label: "Very good", emoji: "😄" },
};

export const moodScoreSchema = z
  .number()
  .int()
  .refine((n): n is MoodScore => MOOD_SCALE.includes(n as MoodScore), {
    message: "Mood must be between 1 and 5",
  });

export const journalEntrySchema = z.object({
  id: z.string(),
  /** ISO 8601 timestamp. */
  createdAt: z.string(),
  mood: moodScoreSchema,
  /** Open-ended free text. Capped to keep prompts and storage bounded. */
  text: z.string().max(5000),
  /** Optional self-applied tags, e.g. "mock test", "sleep". */
  tags: z.array(z.string().max(40)).max(12).default([]),
});
export type JournalEntry = z.infer<typeof journalEntrySchema>;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Structured output we ask Gemini to return for the insights view. */
export const insightSchema = z.object({
  summary: z.string(),
  triggers: z.array(
    z.object({
      label: z.string(),
      /** A short verbatim phrase from the user's own entries (evidence). */
      evidence: z.string(),
    })
  ),
  patterns: z.array(z.string()),
  copingStrategies: z.array(
    z.object({
      title: z.string(),
      steps: z.array(z.string()),
    })
  ),
  mindfulnessExercise: z.object({
    title: z.string(),
    durationMinutes: z.number(),
    steps: z.array(z.string()),
  }),
  encouragement: z.string(),
});
export type Insight = z.infer<typeof insightSchema>;
