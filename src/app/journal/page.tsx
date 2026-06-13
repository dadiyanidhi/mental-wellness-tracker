import { JournalForm } from "@/components/JournalForm";
import { EntryList } from "@/components/EntryList";

export default function JournalPage() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="new-h">
        <h1 id="new-h" className="mb-4 text-2xl font-bold">
          Daily check-in
        </h1>
        <JournalForm />
      </section>
      <section aria-labelledby="past-h">
        <h2 id="past-h" className="mb-4 text-2xl font-bold">
          Past entries
        </h2>
        <EntryList />
      </section>
    </div>
  );
}
