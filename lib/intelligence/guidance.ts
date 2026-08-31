import { getCallWithLead } from "@/lib/calls/repository";
import { getBusinessContextForLead } from "@/lib/leads/repository";
import {
  generateDuringCallGuidance,
  type DuringCallGuidance,
} from "@/lib/intelligence/during-call";
import type { Lead } from "@/lib/sales/types";

export type CallGuidanceInput = {
  repNotes?: string;
  objection?: string;
};

export type CallGuidanceResult =
  | { ok: true; guidance: DuringCallGuidance; lead: Lead; callId: string }
  | { ok: false; reason: "not_found" | "forbidden" };

export function resolveCallGuidanceAccess(
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

export async function getGuidanceForCall(
  callId: string,
  organizationId: string,
  input: CallGuidanceInput = {},
): Promise<CallGuidanceResult> {
  const callWithLead = await getCallWithLead(callId);
  if (!callWithLead) {
    return { ok: false, reason: "not_found" };
  }

  const access = resolveCallGuidanceAccess(callWithLead.lead, organizationId);
  if (access !== "ok") {
    return { ok: false, reason: access };
  }

  const context = await getBusinessContextForLead(callWithLead.lead);
  const guidance = await generateDuringCallGuidance({
    lead: callWithLead.lead,
    context,
    repNotes: input.repNotes,
    objection: input.objection,
  });

  return {
    ok: true,
    guidance,
    lead: callWithLead.lead,
    callId: callWithLead.call.id,
  };
}
