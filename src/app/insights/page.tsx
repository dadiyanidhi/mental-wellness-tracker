import { InsightView } from "@/components/InsightView";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your insights</h1>
      <p className="text-muted">
        Saathi reads your recent entries to gently surface patterns and stress
        triggers you might not notice yourself.
      </p>
      <InsightView />
    </div>
  );
}
