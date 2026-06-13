/**
 * Crisis-safety layer.
 *
 * Research finding (APA, JMIR 2025): general-purpose LLMs are NOT validated for
 * acute psychological crises, and most wellness chatbots have weak crisis
 * handling. Saathi therefore treats safety as a deterministic gate that runs
 * BEFORE and independently of the model — never relying on the LLM alone to
 * decide whether a user is in danger.
 *
 * This is a screening heuristic, not a clinical instrument. It is intentionally
 * high-recall (better a false positive that shows help resources than a missed
 * cry for help). The LLM acts as a second, softer signal; either tripping
 * escalates to the resource panel.
 */

export type CrisisLevel = "none" | "elevated" | "acute";

export interface CrisisSignal {
  level: CrisisLevel;
  /** The phrases that matched, for transparency / debugging. Never shown raw to the user. */
  matched: string[];
}

/** High-severity phrases suggesting intent to self-harm or suicide. */
const ACUTE_PATTERNS: RegExp[] = [
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bend it all\b/i,
  /\b(want|going) to die\b/i,
  /\bsuicid(e|al)\b/i,
  /\bno reason to live\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\bcan'?t go on\b/i,
  /\bharm(ing)? myself\b/i,
  /\bhurt myself\b/i,
  /\btake my (own )?life\b/i,
];

/** Lower-severity distress that warrants a gentle check-in + resources. */
const ELEVATED_PATTERNS: RegExp[] = [
  /\bhopeless\b/i,
  /\bworthless\b/i,
  /\bgive up\b/i,
  /\bcan'?t (do|take) (this|it) anymore\b/i,
  /\bnobody cares\b/i,
  /\bi hate myself\b/i,
  /\bpanic attack\b/i,
  /\bbreaking down\b/i,
];

function collectMatches(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) matches.push(m[0]);
  }
  return matches;
}

/**
 * Screen free text for crisis signals. Pure and synchronous so it can run on
 * the client for instant feedback and on the server as a hard gate.
 */
export function screenForCrisis(text: string): CrisisSignal {
  const acute = collectMatches(text, ACUTE_PATTERNS);
  if (acute.length > 0) return { level: "acute", matched: acute };

  const elevated = collectMatches(text, ELEVATED_PATTERNS);
  if (elevated.length > 0) return { level: "elevated", matched: elevated };

  return { level: "none", matched: [] };
}

export interface Helpline {
  name: string;
  contact: string;
  detail: string;
  /** Tel/URL for an accessible, clickable link. */
  href: string;
}

/**
 * India-specific helplines — the challenge targets NEET/JEE/UPSC aspirants,
 * who are overwhelmingly in India. Government and well-established services.
 */
export const INDIA_HELPLINES: Helpline[] = [
  {
    name: "Tele-MANAS (Govt. of India)",
    contact: "14416 / 1-800-891-4416",
    detail: "Free, 24×7, multilingual mental-health support.",
    href: "tel:14416",
  },
  {
    name: "KIRAN Helpline",
    contact: "1800-599-0019",
    detail: "24×7 toll-free mental-health rehabilitation helpline.",
    href: "tel:18005990019",
  },
  {
    name: "iCall (TISS)",
    contact: "9152987821",
    detail: "Mon–Sat, 8am–10pm. Counselling by trained professionals.",
    href: "tel:9152987821",
  },
  {
    name: "AASRA",
    contact: "9820466726",
    detail: "24×7 helpline for those feeling distressed or suicidal.",
    href: "tel:9820466726",
  },
];

/**
 * Calm, non-judgemental message shown alongside helplines. Kept as data (not
 * model-generated) so it can be reviewed and is guaranteed safe.
 */
export const CRISIS_MESSAGE =
  "It sounds like you're carrying something really heavy right now, and I'm glad you told me. " +
  "I'm a study-wellness companion, not a substitute for a person who can help you through this. " +
  "Please consider reaching out to one of these free, confidential helplines — talking to a real person can help.";
