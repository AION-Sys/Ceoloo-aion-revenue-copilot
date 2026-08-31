import { getBusinessContextForLead, getLeadById } from "@/lib/leads/repository";
import { buildPreCallBrief, type PreCallBrief } from "@/lib/intelligence/pre-call";
import type { Lead } from "@/lib/sales/types";

export type PreCallBriefResult =
  | { ok: true; brief: PreCallBrief }
  | { ok: false; reason: "not_found" | "forbidden" };

export function resolvePreCallBriefAccess(
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

export async function getPreCallBriefForLead(
  leadId: string,
  organizationId: string,
): Promise<PreCallBriefResult> {
  const lead = await getLeadById(leadId);
  const access = resolvePreCallBriefAccess(lead, organizationId);

  if (access !== "ok") {
    return { ok: false, reason: access };
  }

  const context = await getBusinessContextForLead(lead!);
  return { ok: true, brief: buildPreCallBrief(lead!, context) };
}
