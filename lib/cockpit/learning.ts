import { qualificationToLeadStatus } from "@/lib/crm/status";
import {
  buildInterventionId,
  type InterventionRecord,
  interventionToLearningSignal,
} from "@/lib/learning/interventions";
import type { CallOutcome, FunnelStage, Lead } from "@/lib/sales/types";
import type { LearningSignal } from "@/lib/cockpit/types";

export function buildLearningSignals(input: {
  leads: Lead[];
  outcomes: Array<{
    lead: Lead;
    outcome: CallOutcome;
    intervention?: string;
    interventionId?: string;
  }>;
  /** Prefer explicit intervention records when available. */
  interventions?: InterventionRecord[];
}): LearningSignal[] {
  const fromInterventions = (input.interventions ?? []).map((record) => {
    const lead = input.leads.find((item) => item.id === record.leadId);
    return interventionToLearningSignal(record, {
      companyName: lead?.companyName,
      title: lead
        ? `${lead.companyName} · ${record.kind.replace(/_/g, " ")}`
        : undefined,
    });
  });

  const fromOutcomes = input.outcomes.map(({ lead, outcome, intervention, interventionId }, index) => {
    const stageTo = qualificationToLeadStatus(outcome.qualification);
    const stageFrom = (lead.status ?? "lead") as FunnelStage;
    const useful =
      outcome.qualification === "qualified" ||
      outcome.qualification === "exploring"
        ? true
        : outcome.qualification === "disqualified"
          ? false
          : null;

    const recommendation = intervention ?? outcome.nextAction;
    const resolvedId =
      interventionId ??
      buildInterventionId({
        kind: "next_best_action",
        callId: outcome.id,
        leadId: lead.id,
        recommendation,
      });

    return {
      id: `learn-${outcome.id}-${index}`,
      interventionId: resolvedId,
      title: `${lead.companyName} · ${outcome.qualification}`,
      detail:
        outcome.transcriptSummary?.trim() ||
        outcome.painPoints.slice(0, 2).join("; ") ||
        "Structured outcome recorded",
      intervention: recommendation,
      outcome: outcome.nextAction,
      stageFrom,
      stageTo,
      useful,
      repUsed: useful === true ? true : useful === false ? false : null,
      occurredAt: outcome.occurredAt,
    } satisfies LearningSignal;
  });

  return [...fromInterventions, ...fromOutcomes];
}
