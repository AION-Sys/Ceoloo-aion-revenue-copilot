"use server";

import {
  applyInterventionFeedback,
  getIntervention,
  type InterventionFeedback,
  upsertIntervention,
} from "@/lib/learning/interventions";
import { retainInterventionLearning } from "@/lib/learning/memory/loop";
import { organizationLearningBankId } from "@/lib/learning/memory/env";

export type RecordInterventionFeedbackResult =
  | { ok: true; interventionId: string }
  | { ok: false; reason: "not_found" | "invalid" };

/**
 * Capture rep_used / useful / outcome fields for a stable intervention id.
 * Re-retains into the learning memory bank so usefulness is measurable.
 */
export async function recordInterventionFeedbackAction(input: {
  interventionId: string;
  feedback: InterventionFeedback;
}): Promise<RecordInterventionFeedbackResult> {
  const id = input.interventionId?.trim();
  if (!id) {
    return { ok: false, reason: "invalid" };
  }

  const existing = getIntervention(id);
  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  const updated = applyInterventionFeedback(existing, input.feedback);
  upsertIntervention(updated);

  try {
    await retainInterventionLearning(updated, {
      organizationId: updated.organizationId,
      bankId: updated.organizationId
        ? organizationLearningBankId(updated.organizationId)
        : undefined,
    });
  } catch {
    // Feedback is stored locally even if memory retain fails.
  }

  return { ok: true, interventionId: updated.interventionId };
}
