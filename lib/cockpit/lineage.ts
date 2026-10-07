import type { CallOutcome } from "@/lib/sales/types";
import type {
  ActionEvidenceState,
  CrmChangeProposal,
  LineageStep,
  LineageTrail,
} from "@/lib/cockpit/types";

function statusFromEvidence(
  state: ActionEvidenceState | undefined,
  fallback: LineageStep["status"] = "pending",
): LineageStep["status"] {
  if (state === "confirmed") return "done";
  if (state === "approved") return "active";
  if (state === "rejected") return "blocked";
  if (state === "draft") return "active";
  return fallback;
}

/**
 * Builds the Product Lab lineage trail:
 * conversation → evidence → recommendation → rep decision → CRM action → outcome
 */
export function buildLineageTrail(input: {
  leadId: string;
  hasConversation: boolean;
  hasEvidence: boolean;
  recommendation?: string;
  repDecision?: string;
  crmProposal?: CrmChangeProposal | null;
  outcome?: CallOutcome | null;
}): LineageTrail {
  const crmState = input.crmProposal?.evidenceState;
  const crmConfirmed = crmState === "confirmed";
  const hasOutcome = Boolean(input.outcome);

  const steps: LineageStep[] = [
    {
      id: "conversation",
      label: "Conversation",
      detail: input.hasConversation
        ? "Call session captured"
        : "No eligible call session yet",
      status: input.hasConversation ? "done" : "pending",
    },
    {
      id: "evidence",
      label: "Evidence",
      detail: input.hasEvidence
        ? "Facts, pains, or objections captured"
        : "Waiting for structured evidence",
      status: input.hasEvidence ? "done" : input.hasConversation ? "active" : "pending",
    },
    {
      id: "recommendation",
      label: "Recommendation",
      detail: input.recommendation ?? "Next-best action not yet proposed",
      status: input.recommendation
        ? "done"
        : input.hasEvidence
          ? "active"
          : "pending",
    },
    {
      id: "rep_decision",
      label: "Rep decision",
      detail: input.repDecision ?? "Rep has not confirmed a decision",
      status: input.repDecision
        ? "done"
        : input.recommendation
          ? "active"
          : "pending",
    },
    {
      id: "crm_action",
      label: "CRM action",
      detail: input.crmProposal
        ? crmConfirmed
          ? `Confirmed externally${
              input.crmProposal.externalConfirmationId
                ? ` · ${input.crmProposal.externalConfirmationId}`
                : ""
            }`
          : `${crmState ?? "draft"} — not claimed as written`
        : "No CRM write proposed",
      status: input.crmProposal
        ? statusFromEvidence(crmState)
        : input.repDecision
          ? "active"
          : "pending",
    },
    {
      id: "outcome",
      label: "Outcome",
      detail: hasOutcome
        ? `${input.outcome!.qualification} · ${input.outcome!.nextAction}`
        : "Outcome not recorded",
      status: hasOutcome ? "done" : crmConfirmed ? "active" : "pending",
    },
  ];

  return { leadId: input.leadId, steps };
}
