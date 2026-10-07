import { QUALIFICATION_DIMENSIONS } from "@/lib/sales/motion";
import { deriveQualificationState } from "@/lib/sales/qualification-engine";
import type { QualificationProfile } from "@/lib/sales/types";
import type { QualificationCompleteness, QualificationGap } from "@/lib/cockpit/types";

/**
 * UI completeness over the 9 profile dimensions (excludes evidence-only flags).
 * Prefer `deriveQualificationState` / `buildQualificationEngine` for Copilot policy.
 */
export function scoreQualificationCompleteness(
  profile: QualificationProfile | undefined | null,
): QualificationCompleteness {
  const gaps: QualificationGap[] = [];
  const filledKeys: Array<keyof QualificationProfile> = [];

  for (const dimension of QUALIFICATION_DIMENSIONS) {
    const value = profile?.[dimension.profileKey];
    if (typeof value === "string" && value.trim().length > 0) {
      filledKeys.push(dimension.profileKey);
    } else {
      gaps.push({
        id: dimension.id,
        label: dimension.label,
        profileKey: dimension.profileKey,
      });
    }
  }

  const total = QUALIFICATION_DIMENSIONS.length;
  const filled = filledKeys.length;
  const percent = total === 0 ? 0 : Math.round((filled / total) * 100);

  return { filled, total, percent, gaps, filledKeys };
}

/** Engine view used by policy-aware surfaces (10 flags including next-step commitment). */
export function scoreQualificationEngine(
  profile: QualificationProfile | undefined | null,
  evidence?: { nextStepCommitted?: boolean; nextAction?: string },
) {
  return deriveQualificationState(profile, evidence);
}
