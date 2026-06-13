"use client";

import { CRISIS_MESSAGE, INDIA_HELPLINES } from "@/lib/crisis";

/**
 * Crisis resource panel. Rendered with role="alert" so assistive tech
 * announces it immediately when it appears. Content is static and reviewed —
 * never model-generated.
 */
export function CrisisBanner() {
  return (
    <section
      role="alert"
      aria-labelledby="crisis-heading"
      className="rounded-lg border-2 border-danger bg-surface p-4"
    >
      <h2 id="crisis-heading" className="text-lg font-bold text-danger">
        You don&apos;t have to face this alone
      </h2>
      <p className="mt-2 text-text">{CRISIS_MESSAGE}</p>
      <ul role="list" className="mt-3 space-y-2">
        {INDIA_HELPLINES.map((line) => (
          <li
            key={line.name}
            className="rounded-md border border-border bg-bg p-3"
          >
            <a
              href={line.href}
              className="font-semibold text-primary underline"
            >
              {line.name}: {line.contact}
            </a>
            <p className="text-sm text-muted">{line.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
