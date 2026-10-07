import { qualificationToLeadStatus } from "@/lib/crm/status";
import type { CallOutcome, Lead } from "@/lib/sales/types";
import type { CrmChangeProposal } from "@/lib/cockpit/types";

export function buildCrmProposalsFromOutcome(input: {
  lead: Lead;
  outcome: CallOutcome;
}): CrmChangeProposal[] {
  const nextStatus = qualificationToLeadStatus(input.outcome.qualification);
  const fromStatus = input.lead.status ?? "lead";

  const proposals: CrmChangeProposal[] = [
    {
      id: `crm-status-${input.outcome.id}`,
      leadId: input.lead.id,
      field: "status",
      fromValue: fromStatus,
      toValue: nextStatus,
      reason: `Mapped from qualification “${input.outcome.qualification}”`,
      evidenceState: "draft",
    },
  ];

  if (input.outcome.nextAction.trim()) {
    proposals.push({
      id: `crm-note-${input.outcome.id}`,
      leadId: input.lead.id,
      field: "note",
      fromValue: "(none)",
      toValue: input.outcome.nextAction.trim(),
      reason: "Post-call next action proposed as CRM note/task",
      evidenceState: "draft",
    });
  }

  return proposals;
}

export function approveCrmProposal(proposal: CrmChangeProposal): CrmChangeProposal {
  if (proposal.evidenceState === "confirmed") return proposal;
  return { ...proposal, evidenceState: "approved" };
}

export function rejectCrmProposal(proposal: CrmChangeProposal): CrmChangeProposal {
  if (proposal.evidenceState === "confirmed") return proposal;
  return { ...proposal, evidenceState: "rejected" };
}

/**
 * Mark confirmed only with an external id — UI must not claim a write without it.
 */
export function confirmCrmProposal(
  proposal: CrmChangeProposal,
  externalConfirmationId: string,
): CrmChangeProposal {
  const id = externalConfirmationId.trim();
  if (!id) return proposal;
  return {
    ...proposal,
    evidenceState: "confirmed",
    externalConfirmationId: id,
  };
}
