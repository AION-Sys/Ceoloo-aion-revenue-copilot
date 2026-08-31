import type { CallPhase } from "@/lib/supabase/database.types";
import type { CallRow } from "@/lib/supabase/database.types";

export type Call = {
  id: string;
  leadId: string;
  repUserId: string;
  phase: CallPhase;
  startedAt: string;
  endedAt?: string;
};

export function mapCallRow(row: CallRow): Call {
  return {
    id: row.id,
    leadId: row.lead_id,
    repUserId: row.rep_user_id,
    phase: row.phase,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
  };
}
