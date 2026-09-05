import { WorkspacePlaceholder } from "@/components/shell/WorkspacePlaceholder";

export default function LearningPage() {
  return (
    <WorkspacePlaceholder
      title="Learning"
      description="Winning patterns, losing patterns, recent learnings, and sales experiments."
      emptyTitle="Learning loop not primed"
      emptyDescription="Completed calls feed AION learning events. Patterns appear once outcomes are captured."
      actionLabel="View activity"
      actionHref="/activity"
    />
  );
}
