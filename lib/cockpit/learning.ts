import { qualificationToLeadStatus } from "@/lib/crm/status";
import type { CallOutcome, FunnelStage, Lead } from "@/lib/sales/types";
import type { LearningSignal } from "@/lib/cockpit/types";

export function buildLearningSignals(input: {
  leads: Lead[];
  outcomes: Array<{ lead: Lead; outcome: CallOutcome; intervention?: string }>;
}): LearningSignal[] {
  return input.outcomes.map(({ lead, outcome, intervention }, index) => {
    const stageTo = qualificationToLeadStatus(outcome.qualification);
    const stageFrom = (lead.status ?? "lead") as FunnelStage;
    const useful =
      outcome.qualification === "qualified" ||
      outcome.qualification === "exploring"
        ? true
        : outcome.qualification === "disqualified"
          ? false
          : null;

    return {
      id: `learn-${outcome.id}-${index}`,
      title: `${lead.companyName} · ${outcome.qualification}`,
      detail:
        outcome.transcriptSummary?.trim() ||
        outcome.painPoints.slice(0, 2).join("; ") ||
        "Structured outcome recorded",
      intervention: intervention ?? outcome.nextAction,
      outcome: outcome.nextAction,
      stageFrom,
      stageTo,
      useful,
      occurredAt: outcome.occurredAt,
    };
  });
}
