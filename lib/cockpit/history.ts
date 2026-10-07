import type { Call } from "@/lib/calls/mappers";
import type { CallOutcome, Lead } from "@/lib/sales/types";
import type { InteractionEvent } from "@/lib/cockpit/types";

export function buildInteractionHistory(input: {
  lead: Lead;
  calls?: Call[];
  outcomes?: CallOutcome[];
  extra?: InteractionEvent[];
}): InteractionEvent[] {
  const events: InteractionEvent[] = [
    {
      id: `lead-created-${input.lead.id}`,
      leadId: input.lead.id,
      kind: "lead_created",
      title: "Lead entered workspace",
      detail: `${input.lead.companyName} · source ${input.lead.source ?? "unknown"}`,
      occurredAt: "1970-01-01T00:00:00.000Z",
    },
  ];

  for (const call of input.calls ?? []) {
    events.push({
      id: `call-started-${call.id}`,
      leadId: input.lead.id,
      kind: "call_started",
      title: "Call started",
      detail: `Phase: ${call.phase}`,
      occurredAt: call.startedAt,
    });
    if (call.endedAt) {
      events.push({
        id: `call-ended-${call.id}`,
        leadId: input.lead.id,
        kind: "call_completed",
        title: "Call ended",
        detail: "Awaiting or completed post-call review",
        occurredAt: call.endedAt,
      });
    }
  }

  for (const outcome of input.outcomes ?? []) {
    events.push({
      id: `outcome-${outcome.id}`,
      leadId: input.lead.id,
      kind: "call_completed",
      title: "Structured outcome captured",
      detail: `${outcome.qualification} · next: ${outcome.nextAction}`,
      occurredAt: outcome.occurredAt,
      evidenceState: "draft",
    });
  }

  for (const extra of input.extra ?? []) {
    events.push(extra);
  }

  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
