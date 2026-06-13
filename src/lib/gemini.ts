import "server-only";

import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  SchemaType,
  type Schema,
} from "@google/generative-ai";

/**
 * Server-only Gemini client. The API key is read from the environment and is
 * never exposed to the browser. All model calls funnel through here so config
 * (model, safety settings, temperature) lives in one place.
 */

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your key."
    );
  }
  return new GoogleGenerativeAI(key);
}

// Keep Gemini's own safety filters at default-strict; our crisis gate is an
// independent layer on top, not a replacement.
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/** JSON schema mirroring insightSchema, in Gemini's Schema format. */
const insightResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    triggers: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          evidence: { type: SchemaType.STRING },
        },
        required: ["label", "evidence"],
      },
    },
    patterns: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    copingStrategies: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["title", "steps"],
      },
    },
    mindfulnessExercise: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        durationMinutes: { type: SchemaType.NUMBER },
        steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ["title", "durationMinutes", "steps"],
    },
    encouragement: { type: SchemaType.STRING },
  },
  required: [
    "summary",
    "triggers",
    "patterns",
    "copingStrategies",
    "mindfulnessExercise",
    "encouragement",
  ],
};

/** Generate structured insights. Low temperature: this is an analytical task. */
export async function generateInsight(
  system: string,
  user: string
): Promise<unknown> {
  const model = getClient().getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    safetySettings,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: insightResponseSchema,
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent(user);
  return JSON.parse(result.response.text());
}

/** Generate a single companion chat reply. Slightly warmer temperature. */
export async function generateChatReply(
  system: string,
  contents: { role: "user" | "model"; parts: { text: string }[] }[]
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    safetySettings,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600,
    },
  });

  const result = await model.generateContent({ contents });
  return result.response.text();
}
