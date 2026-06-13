"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { currentStreak, recentEntries, averageMood } from "@/lib/mood";

export default function HomePage() {
  const { ready, entries, exam } = useApp();
  const streak = currentStreak(entries);
  const window = recentEntries(entries, 7);
  const avg = averageMood(window);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Welcome back 🪷</h1>
        <p className="mt-1 text-muted">
          Your private space to check in while preparing for {exam}.
        </p>
      </section>

      {ready && (
        <section
          aria-label="Your week at a glance"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <Card label="Check-in streak">
            {streak} {streak === 1 ? "day" : "days"}
          </Card>
          <Card label="Entries this week">{window.length}</Card>
          <Card label="Average mood">
            {avg !== null ? `${avg} / 5` : "—"}
          </Card>
        </section>
      )}

      <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-2">
        <Action
          href="/journal"
          title="Write today's entry"
          body="A few honest words about how prep is going."
        />
        <Action
          href="/companion"
          title="Talk to Saathi"
          body="Feeling stuck or overwhelmed? Start a conversation."
        />
        <Action
          href="/insights"
          title="See your patterns"
          body="Let AI surface hidden stress triggers from your entries."
        />
        <Action
          href="/settings"
          title="Accessibility & data"
          body="Theme, text size, and full control of your data."
        />
      </section>

      <p className="text-xs text-muted">
        Saathi is a wellness companion, not a substitute for professional care.
        If you ever feel unsafe, please reach out to a helpline — you&apos;ll
        find them in the companion whenever you need them.
      </p>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-bold">{children}</p>
    </div>
  );
}

function Action({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-surface p-4 hover:border-primary"
    >
      <span className="block font-semibold text-primary">{title}</span>
      <span className="mt-1 block text-sm text-muted">{body}</span>
    </Link>
  );
}
