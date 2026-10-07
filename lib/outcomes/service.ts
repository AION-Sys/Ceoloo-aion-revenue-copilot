import { getCallWithLead } from "@/lib/calls/repository";
import { persistCallOutcome } from "@/lib/crm/persistence";
import { getOutcomeByCallId, saveCallOutcome } from "@/lib/outcomes/repository";
import type { PostCallOutcomeInput } from "@/lib/outcomes/validation";
import { mapCallOutcomeRow } from "@/lib/outcomes/mappers";
import type { CallOutcome } from "@/lib/sales/types";
import type { Lead } from "@/lib/sales/types";

export type SubmitCallOutcomeResult =
  | { ok: true; outcome: CallOutcome; lead: Lead; callId: string; created: boolean }
  | { ok: false; reason: "not_found" | "forbidden" | "invalid" | "save_failed" };

export function resolveCallOutcomeAccess(
  lead: Lead | null,
  organizationId: string,
): "not_found" | "forbidden" | "ok" {
  if (!lead) {
    return "not_found";
  }

  if (lead.organizationId !== organizationId) {
    return "forbidden";
  }

  return "ok";
}

export async function submitCallOutcome(
  callId: string,
  organizationId: string,
  input: PostCallOutcomeInput,
): Promise<SubmitCallOutcomeResult> {
  const callWithLead = await getCallWithLead(callId);
  if (!callWithLead) {
    return { ok: false, reason: "not_found" };
  }

  const access = resolveCallOutcomeAccess(callWithLead.lead, organizationId);
  if (access !== "ok") {
    return { ok: false, reason: access };
  }

  const existing = await getOutcomeByCallId(callId);
  let outcome: CallOutcome;
  let created: boolean;

  if (existing) {
    outcome = mapCallOutcomeRow(existing, callWithLead.lead.id);
    created = false;
  } else {
    const saved = await saveCallOutcome(callId, callWithLead.lead.id, input);
    if (!saved) {
      return { ok: false, reason: "save_failed" };
    }
    outcome = saved;
    created = true;
  }

  // Task 7 — CRM persist (lead status + event_log). Learning ingest remains Task 8.
  const crm = await persistCallOutcome(outcome, { callId });
  if (!crm.ok) {
    return { ok: false, reason: "save_failed" };
  }

  return {
    ok: true,
    outcome,
    lead: callWithLead.lead,
    callId,
    created,
  };
}

export async function getCallOutcomeForCall(
  callId: string,
  organizationId: string,
): Promise<SubmitCallOutcomeResult | { ok: false; reason: "not_found" | "forbidden" }> {
  const callWithLead = await getCallWithLead(callId);
  if (!callWithLead) {
    return { ok: false, reason: "not_found" };
  }

  const access = resolveCallOutcomeAccess(callWithLead.lead, organizationId);
  if (access !== "ok") {
    return { ok: false, reason: access };
  }

  const existing = await getOutcomeByCallId(callId);
  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  return {
    ok: true,
    outcome: mapCallOutcomeRow(existing, callWithLead.lead.id),
    lead: callWithLead.lead,
    callId,
    created: false,
  };
}
