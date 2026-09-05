import { WorkspacePlaceholder } from "@/components/shell/WorkspacePlaceholder";

export default function TasksPage() {
  return (
    <WorkspacePlaceholder
      title="Tasks"
      description="Today, upcoming, overdue, and completed follow-ups connected to contacts, deals, and calls."
      emptyTitle="No tasks yet"
      emptyDescription="Post-call outcomes and document requests will create actionable tasks here."
      actionLabel="Open dashboard"
      actionHref="/dashboard"
    />
  );
}
