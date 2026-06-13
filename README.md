# 🪷 Saathi — Study Wellness Companion

A privacy-first, exam-aware **Generative AI mental wellness companion** for students preparing for high-stakes Indian competitive exams (NEET, JEE, CUET, CAT, GATE, UPSC) and board exams.

> *Saathi* (साथी) means "companion" in Hindi.

Saathi turns open-ended daily journaling and mood logs into (1) **evidence-grounded insights** that surface hidden stress triggers, and (2) a **conversational companion** that offers tailored coping strategies, mindfulness, and encouragement — with a hard safety layer underneath.

---

## 1. Chosen vertical

**Mental wellness for competitive-exam aspirants in India.**

This cohort is unusually high-risk: single-attempt-per-year stakes (NEET/JEE), multi-year prep with very low success rates (UPSC), intense peer/rank comparison, and heavy family expectations. The challenge brief asks specifically for a tool that *"uncovers hidden stress triggers and emotional patterns that standard trackers miss"* and acts as *"an empathetic, always-available digital companion."*

## 2. What's already out there — and why it isn't enough

I researched the current landscape (Wysa, Woebot, Reflectly, Daylio, Moodnotes, Sanvello, Headspace/Calm) and the academic literature. The recurring flaws — and how Saathi answers each:

| Flaw in existing solutions | Evidence | Saathi's answer |
|---|---|---|
| **Weak crisis handling.** General LLMs aren't validated for acute crises; ~0.15% of weekly chatbot interactions show suicidal-planning signs, yet response is limited. APA is calling for mandated in-app safeguards. | [APA](https://www.apaservices.org/practice/business/technology/artificial-intelligence-chatbots-therapists), [JMIR 2025](https://www.jmir.org/2025/1/e67114) | A **deterministic crisis gate** (`src/lib/crisis.ts`) that screens text *before* and independently of the model, short-circuits acute signals to a **reviewed, static** message, and surfaces **India-specific government helplines** (Tele-MANAS 14416, KIRAN, iCall, AASRA). |
| **Shallow NLP misses implicit cues** — exactly the "hidden triggers" the brief targets. | [arXiv 2506.00081](https://arxiv.org/pdf/2506.00081) | GenAI analysis over *open-ended* free text, prompted to extract latent triggers and tentative patterns. |
| **Hallucinated patterns** — AI invents trends that aren't there. | [mylifenote](https://blog.mylifenote.ai/the-8-best-ai-journaling-apps-in-2026/) | **Evidence grounding:** every detected trigger must quote the student's *own words*; the prompt forbids ungrounded triggers, and output is schema-validated server-side. |
| **Privacy risk** — emotional data shipped to third parties. | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12775963/) | **Local-first.** Entries live in the browser; no account, no DB, no analytics. Data leaves the device only as the minimal text needed for an explicit insight/chat request. Full export + delete. |
| **Not exam-context-aware** — generic wellness. | — | An **exam-tuned persona** that understands mock-test crashes, rank pressure, revision overwhelm and parental pressure per exam. |
| **Poor accessibility** — Woebot rated "very limited accessibility"; the field largely ignores it. | [Selfpause](https://www.selfpause.com/resources/wysa) | **Accessibility as a first-class feature** (see §5). |

## 3. Approach and logic

Four pillars, mapped to the highest-weighted judging criteria:

1. **Evidence-grounded insight engine** — Gemini analyses recent entries and returns a *structured* object (triggers with verbatim evidence, tentative patterns, coping strategies, a mindfulness exercise, encouragement). Structured output + schema validation limits hallucination.
2. **Conversational companion** — a warm, CBT/mindfulness-informed chat persona, contextualised with the student's recent entries and tuned to their specific exam.
3. **Safety-first** — a deterministic crisis layer that never delegates the safety decision to the LLM.
4. **Privacy + accessibility by design** — local-first storage and WCAG 2.2 AA throughout.

### Prompt engineering

Prompts (`src/lib/prompts.ts`) apply techniques from Google's *Prompt Engineering* whitepaper (Boonstra, 2025): **system + role prompting** (fixed persona), **contextual prompting** (real entries injected), **instructions over constraints** (tell the model what to *do*; reserve hard "never" lines for safety), and **structured JSON output** to force shape and reduce hallucination.

## 4. How the solution works

```
Browser (local-first)                    Next.js server (key never leaves)
┌────────────────────────┐               ┌─────────────────────────────────┐
│ Journal + mood (state)  │   entries     │ /api/analyze                    │
│ localStorage persistence│ ────────────► │  zod-validate → buildInsight    │
│                         │               │  → Gemini (JSON schema) →       │
│ Insights view           │ ◄──────────── │  validate output                │
│ Companion (chat)        │   reply       │ /api/chat                       │
│ Settings / a11y / data  │ ────────────► │  zod-validate → CRISIS GATE →   │
└────────────────────────┘               │  Gemini chat                    │
        ▲                                 └─────────────────────────────────┘
        │ crisis pre-screen (client, instant)            ▲ crisis gate (server, authoritative)
        └───────────────── src/lib/crisis.ts ────────────┘
```

- **Journaling** (`/journal`) — pick a mood (1–5), write freely, add tags. Saved locally.
- **Insights** (`/insights`) — local mood stats (average, 14-day trend, streak) + on-demand Gemini analysis grounded in your entries.
- **Companion** (`/companion`) — chat that remembers your recent context and stays in its exam-wellness lane.
- **Settings** (`/settings`) — exam selection, accessibility controls, export/delete your data.

### Project structure

```
src/
├── app/
│   ├── api/analyze/route.ts   # insight generation (validated in + out)
│   ├── api/chat/route.ts      # chat with crisis gate
│   ├── {journal,insights,companion,settings}/page.tsx
│   ├── layout.tsx             # skip link, landmarks, providers
│   └── globals.css            # theme tokens + a11y themes
├── components/                # AppProvider, Nav, JournalForm, InsightView,
│                              # Companion, MoodPicker, CrisisBanner, Settings…
└── lib/
    ├── crisis.ts              # deterministic safety layer + helplines
    ├── gemini.ts              # server-only Gemini client + response schema
    ├── prompts.ts             # persona + prompt builders
    ├── mood.ts                # pure analytics (avg, trend, streak, tags)
    ├── storage.ts             # local-first persistence + prefs
    ├── rateLimit.ts           # per-IP abuse ceiling on model calls
    └── types.ts               # zod schemas = single source of truth
```

## 5. Accessibility (WCAG 2.2 AA)

- **Keyboard:** every control is reachable and operable; a **skip link** jumps to `<main>`; visible `:focus-visible` outlines are never removed.
- **Screen readers:** semantic landmarks (`header`/`nav`/`main`), labelled regions, `aria-current` nav state, `role="log"` + `aria-live="polite"` so new chat replies are announced, `role="alert"` for the crisis panel and form errors, and `sr-only` context ("You said:" / "Saathi said:").
- **Forms:** the mood picker is a real `radiogroup`; every input has an associated `<label>`; character counts and hints are wired via `aria-describedby`.
- **User-controlled display:** high-contrast theme (≥7:1), dyslexia-friendly font/spacing, text-size scaling (80–160%), and reduce-motion (honours both the OS setting *and* an in-app toggle).
- **Colour:** default palette meets ≥4.5:1; theming is done with CSS variables so contrast is a runtime guarantee, not per-component guesswork.
- **Automated checks:** `jest-axe` runs against components in the test suite.

## 6. Security & efficiency

**Security**
- API key is **server-only** (`import "server-only"`), read from env, never shipped to the client.
- **All API input is zod-validated** and bounded (array sizes, string lengths) — untrusted client input is never trusted.
- **Model output is validated** against the schema before use (defence in depth).
- Per-IP **rate limiting** caps abuse of the paid model endpoints.
- Internal errors are logged server-side and **never leaked** to the client.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) in `next.config.mjs`.
- Local-first storage means there's no central honeypot of sensitive emotional data.

**Efficiency**
- Insights are **on-demand** (a button), not on every keystroke — no wasted model calls.
- Analysis is bounded to a **14-day / 60-entry window** and chat to the **last 5 recent entries**, keeping prompt size and cost predictable.
- `maxOutputTokens` is capped per route; low temperature (0.4) for the analytical task.
- Pure analytics run **locally** with zero model cost.

## 7. Tech stack

Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · Google Gemini (`@google/generative-ai`) · Zod · Vitest + Testing Library + jest-axe.

## 8. Getting started

```bash
npm install
cp .env.example .env.local      # then add your GEMINI_API_KEY
npm run dev                      # http://localhost:3000
```

Get a free Gemini API key at <https://aistudio.google.com/app/apikey>.

```bash
npm run test        # unit + a11y tests
npm run typecheck   # strict TS, no emit
npm run build       # production build
```

## 9. Assumptions

- **Audience is India-based** (the named exams are Indian); helplines are India-specific. Internationalising the helpline set is a config change in `crisis.ts`.
- **Local-first is acceptable for the demo.** Data is per-device and not synced across devices — a deliberate privacy trade-off. The transient text sent to Gemini at request time is processed by Google per their API terms and not persisted by Saathi.
- The **crisis screener is a high-recall heuristic**, not a clinical instrument. It intentionally errs toward showing help. It is English-first; multilingual screening is noted as future work.
- A **single-instance deployment** is assumed for the in-memory rate limiter; production multi-instance would swap in a shared store behind the same interface.
- Gemini is the provider (this targets a Google "Build with AI" context); `gemini.ts` is the single integration point if another provider is ever needed.

## 10. Safety disclaimer

Saathi is a wellness companion, **not** a medical device or a substitute for professional care. It does not diagnose. In a crisis it points users to professional helplines and encourages contact with a trusted person.
