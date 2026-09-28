import type { CallOutcome, QualificationProfile } from "@/lib/sales/types";
import type { CallOutcomeRow } from "@/lib/supabase/database.types";

export function mapCallOutcomeRow(row: CallOutcomeRow, leadId: string): CallOutcome {
  return {
    id: row.id,
    leadId,
    painPoints: row.pain_points,
    objections: row.objections,
    qualification: row.qualification,
    qualificationProfile: emptyProfileToUndefined(row.qualification_profile),
    nextAction: row.next_action,
    transcriptSummary: row.transcript_summary ?? undefined,
    occurredAt: row.created_at,
  };
}

function emptyProfileToUndefined(
  profile: QualificationProfile | null | undefined,
): QualificationProfile | undefined {
  if (!profile) {
    return undefined;
  }

  const entries = Object.entries(profile).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0,
  );

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as QualificationProfile;
}
