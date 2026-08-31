import type { BusinessContextRow, LeadRow } from "@/lib/supabase/database.types";
import type { BusinessContext, Lead } from "@/lib/sales/types";

export function mapLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    organizationId: row.organization_id,
    companyName: row.company_name,
    contactName: row.contact_name ?? undefined,
    source: row.source ?? undefined,
    status: row.status,
    businessContextId: row.business_context_id ?? undefined,
  };
}

export function mapBusinessContextRow(row: BusinessContextRow): BusinessContext {
  return {
    id: row.id,
    organizationId: row.organization_id,
    industry: row.industry,
    services: row.services,
    likelyPains: row.likely_pains,
    relevantOffer: row.relevant_offer ?? undefined,
  };
}

export function createDefaultBusinessContext(organizationId: string): BusinessContext {
  return {
    id: "default",
    organizationId,
    industry: "general",
    services: [],
    likelyPains: [],
  };
}
