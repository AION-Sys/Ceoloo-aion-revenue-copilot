import type { CallOutcomeRow } from "@/lib/supabase/database.types";
import type { CallOutcome } from "@/lib/sales/types";

export function mapCallOutcomeRow(row: CallOutcomeRow, leadId: string): CallOutcome {
  return {
    id: row.id,
    leadId,
    painPoints: row.pain_points,
    objections: row.objections,
    qualification: row.qualification,
    nextAction: row.next_action,
    transcriptSummary: row.transcript_summary ?? undefined,
    occurredAt: row.created_at,
  };
}
