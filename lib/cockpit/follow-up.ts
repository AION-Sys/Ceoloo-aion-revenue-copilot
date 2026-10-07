import type { CallOutcome, Lead } from "@/lib/sales/types";
import type { FollowUpDraft } from "@/lib/cockpit/types";

export function buildFollowUpDraftFromOutcome(input: {
  lead: Lead;
  outcome: CallOutcome;
  id?: string;
}): FollowUpDraft {
  const contact = input.lead.contactName ?? "there";
  const next = input.outcome.nextAction.trim() || "continue the discovery conversation";

  return {
    id: input.id ?? `followup-${input.outcome.id}`,
    leadId: input.lead.id,
    companyName: input.lead.companyName,
    contactName: input.lead.contactName,
    channel: "email",
    subject: `Next step for ${input.lead.companyName}`,
    body: `Hi ${contact},\n\nThanks for the conversation today. Based on what we covered, the clearest next step is: ${next}.\n\nI'll hold this as a draft until you approve send — nothing has been delivered yet.\n\nBest,\nAION`,
    dueAt: input.outcome.occurredAt,
    recommendation: next,
    evidenceState: "draft",
  };
}

export function approveFollowUpDraft(draft: FollowUpDraft): FollowUpDraft {
  if (draft.evidenceState === "confirmed") {
    return draft;
  }
  return { ...draft, evidenceState: "approved" };
}

/**
 * Confirmed only when an external id is supplied — never invent a send.
 */
export function confirmFollowUpDraft(
  draft: FollowUpDraft,
  externalConfirmationId: string,
): FollowUpDraft {
  const id = externalConfirmationId.trim();
  if (!id) {
    return draft;
  }
  return {
    ...draft,
    evidenceState: "confirmed",
    externalConfirmationId: id,
  };
}
