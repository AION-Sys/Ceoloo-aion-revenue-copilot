import { normalizeLeadStatus } from "@/lib/sales/motion";
import type { BusinessContext, Lead } from "@/lib/sales/types";
import type { BusinessContextRow, LeadRow } from "@/lib/supabase/database.types";

export function mapLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    organizationId: row.organization_id,
    companyName: row.company_name,
    contactName: row.contact_name ?? undefined,
    source: row.source ?? undefined,
    status: normalizeLeadStatus(row.status),
    businessContextId: row.business_context_id ?? undefined,
  };
}

export function mapBusinessContextRow(row: BusinessContextRow): BusinessContext {
  return {
    id: row.id,
    organizationId: row.organization_id,
    industry: row.industry,
    existingSystems: row.existing_systems,
    workflowProblems: row.workflow_problems,
    recommendedService: row.recommended_service ?? undefined,
  };
}

export function createDefaultBusinessContext(organizationId: string): BusinessContext {
  return {
    id: "default",
    organizationId,
    industry: "unknown",
    existingSystems: [],
    workflowProblems: [],
  };
}
