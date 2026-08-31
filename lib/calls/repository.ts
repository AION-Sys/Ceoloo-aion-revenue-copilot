import { mapCallRow, type Call } from "@/lib/calls/mappers";
import { getLeadById } from "@/lib/leads/repository";
import type { Lead } from "@/lib/sales/types";
import type { CallRow, Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CallInsert = Database["public"]["Tables"]["calls"]["Insert"];
type CallUpdate = Database["public"]["Tables"]["calls"]["Update"];
type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type CallsTableClient = {
  select: (query?: string) => unknown;
  insert: (values: CallInsert) => {
    select: (columns: string) => {
      single: () => Promise<{ data: CallRow | null; error: { message: string } | null }>;
    };
  };
  update: (values: CallUpdate) => {
    eq: (column: string, value: string) => {
      select: (columns: string) => {
        single: () => Promise<{ data: CallRow | null; error: { message: string } | null }>;
      };
    };
  };
};

function callsTable(supabase: SupabaseClient): CallsTableClient {
  return supabase.from("calls") as unknown as CallsTableClient;
}

export async function getCallById(callId: string): Promise<Call | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("calls").select("*").eq("id", callId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCallRow(data as CallRow);
}

export async function getCallWithLead(
  callId: string,
): Promise<{ call: Call; lead: Lead } | null> {
  const call = await getCallById(callId);
  if (!call) {
    return null;
  }

  const lead = await getLeadById(call.leadId);
  if (!lead) {
    return null;
  }

  return { call, lead };
}

export async function getOrCreateActiveCallForLead(
  leadId: string,
  repUserId: string,
): Promise<Call | null> {
  const supabase = await createSupabaseServerClient();
  const calls = callsTable(supabase);

  const { data: existing, error: existingError } = await supabase
    .from("calls")
    .select("*")
    .eq("lead_id", leadId)
    .eq("rep_user_id", repUserId)
    .in("phase", ["pre", "active"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingError && existing) {
    const call = mapCallRow(existing as CallRow);
    if (call.phase === "pre") {
      const { data: updated, error: updateError } = await calls
        .update({ phase: "active" })
        .eq("id", call.id)
        .select("*")
        .single();

      if (!updateError && updated) {
        return mapCallRow(updated);
      }
    }
    return call;
  }

  const insertPayload: CallInsert = {
    lead_id: leadId,
    rep_user_id: repUserId,
    phase: "active",
    ended_at: null,
  };

  const { data: created, error: createError } = await calls
    .insert(insertPayload)
    .select("*")
    .single();

  if (createError || !created) {
    return null;
  }

  return mapCallRow(created);
}
