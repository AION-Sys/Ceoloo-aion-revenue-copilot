/**
 * Postgres row types aligned with supabase/migrations and docs/DATA_MODEL.md.
 * Task 1 — schema + RLS (Builder).
 */

import type { ObjectionRecord, QualificationState } from "@/lib/sales/types";

export type OrganizationRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: "rep" | "manager" | "admin";
  created_at: string;
};

export type BusinessContextRow = {
  id: string;
  organization_id: string;
  industry: string;
  services: string[];
  likely_pains: string[];
  relevant_offer: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadStatus = "new" | "contacted" | "qualified" | "closed";

export type LeadRow = {
  id: string;
  organization_id: string;
  business_context_id: string | null;
  company_name: string;
  contact_name: string | null;
  source: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
};

export type CallPhase = "pre" | "active" | "post" | "completed";

export type CallRow = {
  id: string;
  lead_id: string;
  rep_user_id: string;
  phase: CallPhase;
  started_at: string;
  ended_at: string | null;
};

export type CallOutcomeRow = {
  id: string;
  call_id: string;
  qualification: QualificationState;
  pain_points: string[];
  objections: ObjectionRecord[];
  next_action: string;
  transcript_summary: string | null;
  created_at: string;
};

export type EventLogType = "crm" | "learning";

export type EventLogRow = {
  id: string;
  call_id: string | null;
  lead_id: string | null;
  event_type: EventLogType;
  payload: Record<string, unknown>;
  external_id: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      organizations: { Row: OrganizationRow; Insert: Omit<OrganizationRow, "created_at" | "updated_at"> & Partial<Pick<OrganizationRow, "created_at" | "updated_at">>; Update: Partial<OrganizationRow> };
      organization_members: { Row: OrganizationMemberRow; Insert: Omit<OrganizationMemberRow, "id" | "created_at"> & Partial<Pick<OrganizationMemberRow, "id" | "created_at">>; Update: Partial<OrganizationMemberRow> };
      business_contexts: { Row: BusinessContextRow; Insert: Omit<BusinessContextRow, "id" | "created_at" | "updated_at"> & Partial<Pick<BusinessContextRow, "id" | "created_at" | "updated_at">>; Update: Partial<BusinessContextRow> };
      leads: { Row: LeadRow; Insert: Omit<LeadRow, "id" | "created_at" | "updated_at"> & Partial<Pick<LeadRow, "id" | "created_at" | "updated_at">>; Update: Partial<LeadRow> };
      calls: { Row: CallRow; Insert: Omit<CallRow, "id" | "started_at"> & Partial<Pick<CallRow, "id" | "started_at">>; Update: Partial<CallRow> };
      call_outcomes: { Row: CallOutcomeRow; Insert: Omit<CallOutcomeRow, "id" | "created_at"> & Partial<Pick<CallOutcomeRow, "id" | "created_at">>; Update: Partial<CallOutcomeRow> };
      event_log: { Row: EventLogRow; Insert: Omit<EventLogRow, "id" | "created_at"> & Partial<Pick<EventLogRow, "id" | "created_at">>; Update: Partial<EventLogRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
