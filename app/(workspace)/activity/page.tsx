import { WorkspacePlaceholder } from "@/components/shell/WorkspacePlaceholder";

export default function ActivityPage() {
  return (
    <WorkspacePlaceholder
      title="Activity"
      description="Unified chronological feed of calls, emails, status changes, notes, scope updates, proposals, and onboarding."
      emptyTitle="Activity feed is empty"
      emptyDescription="As reps work the Prepare → Call → Capture loop, events will stream here with filters by rep, deal, type, and date."
      actionLabel="Open dashboard"
      actionHref="/dashboard"
    />
  );
}
