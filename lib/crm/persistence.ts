import type {
  CallOutcome,
  CrmEvent,
  LeadStatus,
  QualificationState,
} from "@/lib/sales/types";
import type { Database, EventLogRow } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventLogInsert = Database["public"]["Tables"]["event_log"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type LeadsTableClient = {
  update: (values: LeadUpdate) => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
};

type EventLogTableClient = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{
        data: Array<Pick<EventLogRow, "id" | "payload">> | null;
        error: { message: string } | null;
      }>;
    };
  };
  insert: (values: EventLogInsert) => {
    select: (columns: string) => {
      single: () => Promise<{
        data: Pick<EventLogRow, "id"> | null;
        error: { message: string } | null;
      }>;
    };
  };
};

function leadsTable(supabase: SupabaseClient): LeadsTableClient {
  return supabase.from("leads") as unknown as LeadsTableClient;
}

function eventLogTable(supabase: SupabaseClient): EventLogTableClient {
  return supabase.from("event_log") as unknown as EventLogTableClient;
}

export function outcomeToCrmEvent(outcome: CallOutcome): CrmEvent {
  return {
    eventType: "call_completed",
    leadId: outcome.leadId,
    payload: {
      qualification: outcome.qualification,
      nextAction: outcome.nextAction,
      outcomeId: outcome.id,
    },
    occurredAt: outcome.occurredAt,
  };
}

/**
 * Maps post-call qualification onto CRM lead status (docs/DATA_MODEL.md leads.status).
 */
export function qualificationToLeadStatus(qualification: QualificationState): LeadStatus {
  switch (qualification) {
    case "qualified":
      return "qualified";
    case "disqualified":
      return "closed";
    case "exploring":
    case "unqualified":
      return "contacted";
  }
}

/**
 * CRM event payload contract v1 (docs/DATA_MODEL.md).
 */
export function buildCrmEventPayload(outcome: CallOutcome): Record<string, unknown> {
  return {
    schema_version: "1",
    event_type: "call_completed",
    lead_id: outcome.leadId,
    qualification: outcome.qualification,
    next_action: outcome.nextAction,
    outcome_id: outcome.id,
    occurred_at: outcome.occurredAt,
  };
}

export type CrmPersistResult = {
  ok: boolean;
  recordId?: string;
};

export type CrmPersistContext = {
  callId: string;
};

function findExistingCrmEventId(
  rows: Array<Pick<EventLogRow, "id" | "payload">> | null | undefined,
  outcomeId: string,
): string | undefined {
  if (!rows?.length) {
    return undefined;
  }

  for (const row of rows) {
    if (row.payload?.outcome_id === outcomeId) {
      return row.id;
    }
  }

  return undefined;
}

/**
 * Persists CRM lead/call state after a structured call outcome:
 * - updates `leads.status` from qualification
 * - writes a `event_log` row with event_type `crm` (contract v1 payload)
 *
 * Idempotent on outcome_id: re-submits reuse the existing CRM event row.
 * Call outcome rows themselves are owned by Task 6 (`lib/outcomes`).
 */
export async function persistCallOutcome(
  outcome: CallOutcome,
  context: CrmPersistContext,
): Promise<CrmPersistResult> {
  if (!outcome.leadId || !outcome.id || !context.callId) {
    return { ok: false };
  }

  if (!getSupabasePublicEnv().ok) {
    return { ok: false };
  }

  const supabase = await createSupabaseServerClient();
  const leads = leadsTable(supabase);
  const events = eventLogTable(supabase);

  const leadStatus = qualificationToLeadStatus(outcome.qualification);
  const { error: leadError } = await leads
    .update({ status: leadStatus })
    .eq("id", outcome.leadId);

  if (leadError) {
    return { ok: false };
  }

  const { data: existingRows, error: existingError } = await events
    .select("id, payload")
    .eq("event_type", "crm")
    .eq("lead_id", outcome.leadId);

  if (existingError) {
    return { ok: false };
  }

  const existingId = findExistingCrmEventId(existingRows, outcome.id);
  if (existingId) {
    return { ok: true, recordId: existingId };
  }

  const insertPayload: EventLogInsert = {
    call_id: context.callId,
    lead_id: outcome.leadId,
    event_type: "crm",
    payload: buildCrmEventPayload(outcome),
    external_id: null,
  };

  const { data: created, error: createError } = await events
    .insert(insertPayload)
    .select("id")
    .single();

  if (createError || !created) {
    return { ok: false };
  }

  return { ok: true, recordId: created.id };
}
