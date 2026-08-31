import {
  createDefaultBusinessContext,
  mapBusinessContextRow,
  mapLeadRow,
} from "@/lib/leads/mappers";
import type { BusinessContext, Lead } from "@/lib/sales/types";
import type { BusinessContextRow, LeadRow } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listLeadsForOrganization(organizationId: string): Promise<Lead[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as LeadRow[]).map(mapLeadRow);
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapLeadRow(data as LeadRow);
}

export async function getBusinessContextForLead(lead: Lead): Promise<BusinessContext> {
  const supabase = await createSupabaseServerClient();

  if (lead.businessContextId) {
    const { data, error } = await supabase
      .from("business_contexts")
      .select("*")
      .eq("id", lead.businessContextId)
      .maybeSingle();

    if (!error && data) {
      return mapBusinessContextRow(data as BusinessContextRow);
    }
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from("business_contexts")
    .select("*")
    .eq("organization_id", lead.organizationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!fallbackError && fallback) {
    return mapBusinessContextRow(fallback as BusinessContextRow);
  }

  return createDefaultBusinessContext(lead.organizationId);
}
