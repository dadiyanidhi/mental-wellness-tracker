"use client";

import { journalEntrySchema, type JournalEntry } from "./types";
import { z } from "zod";

/**
 * Local-first persistence (privacy by design).
 *
 * All journal data lives in the browser's localStorage and never leaves the
 * device except as the minimal text sent to the server-side Gemini route at
 * the moment the user explicitly asks for insights or chats. There is no
 * account, no database, no analytics. This directly addresses the privacy gap
 * found in most commercial wellness apps (data shipped to third parties).
 */

const STORAGE_KEY = "saathi.entries.v1";
const PREFS_KEY = "saathi.prefs.v1";

const entriesSchema = z.array(journalEntrySchema);

// Generic over the schema so the return type is the schema's *output* type
// (z.infer), correctly handling defaults/effects where input ≠ output.
function safeParse<S extends z.ZodTypeAny>(
  raw: string | null,
  schema: S,
  fallback: z.infer<S>
): z.infer<S> {
  if (!raw) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    // Corrupted storage should degrade gracefully, never crash the app.
    return fallback;
  }
}

export function loadEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY), entriesSchema, []);
}

export function saveEntries(entries: JournalEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(entry: JournalEntry): JournalEntry[] {
  const next = [entry, ...loadEntries()];
  saveEntries(next);
  return next;
}

export function deleteEntry(id: string): JournalEntry[] {
  const next = loadEntries().filter((e) => e.id !== id);
  saveEntries(next);
  return next;
}

/** Export everything as a downloadable JSON blob (user owns their data). */
export function exportEntries(): string {
  return JSON.stringify(loadEntries(), null, 2);
}

/** Irreversibly wipe all stored data. */
export function clearAll(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ---- Accessibility / display preferences ----

export interface Prefs {
  highContrast: boolean;
  dyslexiaFont: boolean;
  reduceMotion: boolean;
  /** Root font scale, 1 = 100%. */
  textScale: number;
}

export const DEFAULT_PREFS: Prefs = {
  highContrast: false,
  dyslexiaFont: false,
  reduceMotion: false,
  textScale: 1,
};

const prefsSchema = z.object({
  highContrast: z.boolean(),
  dyslexiaFont: z.boolean(),
  reduceMotion: z.boolean(),
  textScale: z.number().min(0.8).max(1.6),
});

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  return safeParse(localStorage.getItem(PREFS_KEY), prefsSchema, DEFAULT_PREFS);
}

export function savePrefs(prefs: Prefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/** Generate a collision-resistant id without pulling in a uuid dependency. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
