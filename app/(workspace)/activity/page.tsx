import { WorkspacePlaceholder } from "@/components/shell/WorkspacePlaceholder";

export default function ActivityPage() {
  return (
    <WorkspacePlaceholder
      title="Activity"
      description="Unified chronological feed of calls, emails, SMS, status changes, documents, tasks, notes, applications, offers, and funding outcomes."
      emptyTitle="Activity feed is empty"
      emptyDescription="As reps work the Prepare → Call → Capture loop, events will stream here with filters by rep, deal, type, and date."
      actionLabel="Open dashboard"
      actionHref="/dashboard"
    />
  );
}
