import type { Call } from "@/lib/calls/mappers";
import {
  DEMO_CALL_ID,
  DEMO_CONTEXT_ID,
  DEMO_LEAD_ID,
  DEMO_ORG_ID,
  DEMO_USER_ID,
} from "@/lib/auth/demo";
import type { BusinessContext, Lead } from "@/lib/sales/types";

export const DEMO_LEAD: Lead = {
  id: DEMO_LEAD_ID,
  organizationId: DEMO_ORG_ID,
  companyName: "Acme HVAC",
  contactName: "Jordan Lee",
  source: "outbound",
  status: "new",
  businessContextId: DEMO_CONTEXT_ID,
};

export const DEMO_BUSINESS_CONTEXT: BusinessContext = {
  id: DEMO_CONTEXT_ID,
  organizationId: DEMO_ORG_ID,
  industry: "home-services",
  services: ["HVAC repair", "maintenance"],
  likelyPains: ["slow lead response", "inconsistent follow-up"],
  relevantOffer: "conversion copilot trial",
};

export function getDemoCall(): Call {
  return {
    id: DEMO_CALL_ID,
    leadId: DEMO_LEAD_ID,
    repUserId: DEMO_USER_ID,
    phase: "active",
    startedAt: new Date().toISOString(),
    endedAt: undefined,
  };
}

export function listDemoLeadsForOrganization(organizationId: string): Lead[] {
  if (organizationId !== DEMO_ORG_ID) {
    return [];
  }
  return [DEMO_LEAD];
}

export function getDemoLeadById(leadId: string): Lead | null {
  return leadId === DEMO_LEAD_ID ? DEMO_LEAD : null;
}

export function getDemoBusinessContextForLead(lead: Lead): BusinessContext {
  if (lead.organizationId !== DEMO_ORG_ID) {
    return {
      id: "00000000-0000-4000-8000-000000000000",
      organizationId: lead.organizationId,
      industry: "unknown",
      services: [],
      likelyPains: [],
    };
  }
  return DEMO_BUSINESS_CONTEXT;
}

export function getDemoCallById(callId: string): Call | null {
  return callId === DEMO_CALL_ID ? getDemoCall() : null;
}

export function getOrCreateDemoCallForLead(leadId: string): Call | null {
  if (leadId !== DEMO_LEAD_ID) {
    return null;
  }
  return getDemoCall();
}
