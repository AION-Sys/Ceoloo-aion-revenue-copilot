import { WorkspacePlaceholder } from "@/components/shell/WorkspacePlaceholder";

export default function IntelligencePage() {
  return (
    <WorkspacePlaceholder
      title="Intelligence"
      description="Objection analytics, conversion funnel drop-offs, and rep insights grounded in real outcome data."
      emptyTitle="Waiting for conversation evidence"
      emptyDescription="Intelligence surfaces activate after calls emit structured outcomes — no fabricated metrics."
      actionLabel="Start from calls"
      actionHref="/calls"
    />
  );
}
