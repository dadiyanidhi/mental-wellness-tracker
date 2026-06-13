"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Exam, JournalEntry } from "@/lib/types";
import {
  DEFAULT_PREFS,
  loadEntries,
  loadPrefs,
  savePrefs,
  saveEntries,
  type Prefs,
} from "@/lib/storage";

const EXAM_KEY = "saathi.exam.v1";

interface AppState {
  ready: boolean;
  entries: JournalEntry[];
  setEntries: (entries: JournalEntry[]) => void;
  exam: Exam;
  setExam: (exam: Exam) => void;
  prefs: Prefs;
  setPrefs: (prefs: Prefs) => void;
}

const AppContext = createContext<AppState | null>(null);

/** Apply accessibility prefs to the document root. */
function applyPrefs(prefs: Prefs): void {
  const root = document.documentElement;
  root.dataset.contrast = prefs.highContrast ? "high" : "normal";
  root.dataset.dyslexia = String(prefs.dyslexiaFont);
  root.dataset.reduceMotion = String(prefs.reduceMotion);
  root.style.setProperty("--text-scale", String(prefs.textScale));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntriesState] = useState<JournalEntry[]>([]);
  const [exam, setExamState] = useState<Exam>("Other");
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);

  // Hydrate from localStorage once on mount (client only).
  useEffect(() => {
    const loadedPrefs = loadPrefs();
    setEntriesState(loadEntries());
    setPrefsState(loadedPrefs);
    const savedExam = localStorage.getItem(EXAM_KEY) as Exam | null;
    if (savedExam) setExamState(savedExam);
    applyPrefs(loadedPrefs);
    setReady(true);
  }, []);

  const setEntries = useCallback((next: JournalEntry[]) => {
    setEntriesState(next);
    saveEntries(next);
  }, []);

  const setExam = useCallback((next: Exam) => {
    setExamState(next);
    localStorage.setItem(EXAM_KEY, next);
  }, []);

  const setPrefs = useCallback((next: Prefs) => {
    setPrefsState(next);
    savePrefs(next);
    applyPrefs(next);
  }, []);

  const value = useMemo(
    () => ({ ready, entries, setEntries, exam, setExam, prefs, setPrefs }),
    [ready, entries, setEntries, exam, setExam, prefs, setPrefs]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
