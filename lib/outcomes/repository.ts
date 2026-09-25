import { mapCallOutcomeRow } from "@/lib/outcomes/mappers";
import type { PostCallOutcomeInput } from "@/lib/outcomes/validation";
import type { CallOutcome } from "@/lib/sales/types";
import type { CallOutcomeRow, Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CallOutcomeInsert = Database["public"]["Tables"]["call_outcomes"]["Insert"];
type CallUpdate = Database["public"]["Tables"]["calls"]["Update"];
type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type CallOutcomesTableClient = {
  insert: (values: CallOutcomeInsert) => {
    select: (columns: string) => {
      single: () => Promise<{ data: CallOutcomeRow | null; error: { message: string } | null }>;
    };
  };
};

type CallsTableClient = {
  update: (values: CallUpdate) => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
};

function callOutcomesTable(supabase: SupabaseClient): CallOutcomesTableClient {
  return supabase.from("call_outcomes") as unknown as CallOutcomesTableClient;
}

function callsTable(supabase: SupabaseClient): CallsTableClient {
  return supabase.from("calls") as unknown as CallsTableClient;
}

export async function getOutcomeByCallId(callId: string): Promise<CallOutcomeRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("call_outcomes")
    .select("*")
    .eq("call_id", callId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CallOutcomeRow;
}

export async function saveCallOutcome(
  callId: string,
  leadId: string,
  input: PostCallOutcomeInput,
): Promise<CallOutcome | null> {
  const supabase = await createSupabaseServerClient();
  const outcomes = callOutcomesTable(supabase);
  const calls = callsTable(supabase);

  const existing = await getOutcomeByCallId(callId);
  if (existing) {
    return mapCallOutcomeRow(existing, leadId);
  }

  const insertPayload: CallOutcomeInsert = {
    call_id: callId,
    qualification: input.qualification,
    pain_points: input.painPoints,
    objections: input.objections,
    next_action: input.nextAction,
    transcript_summary: input.transcriptSummary ?? null,
  };

  const { data: created, error: createError } = await outcomes
    .insert(insertPayload)
    .select("*")
    .single();

  if (createError || !created) {
    return null;
  }

  const endedAt = new Date().toISOString();
  const { error: updateError } = await calls
    .update({ phase: "completed", ended_at: endedAt })
    .eq("id", callId);

  if (updateError) {
    return null;
  }

  return mapCallOutcomeRow(created, leadId);
}
