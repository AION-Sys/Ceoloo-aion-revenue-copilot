import { hasQuantifiedEconomicImpact } from "@/lib/sales/economic-impact";
import {
  QUALIFICATION_DIMENSIONS,
  type QualificationProfileTextKey,
} from "@/lib/sales/motion";
import type { BusinessContext, Lead, QualificationProfile } from "@/lib/sales/types";

/**
 * Structured qualification flags (finish-line state machine).
 * Nine flags map to AION profile dimensions; `next_step_committed` is evidence-backed.
 */
export const QUALIFICATION_FLAG_IDS = [
  "pain_confirmed",
  "impact_quantified",
  "systems_identified",
  "automation_opportunity",
  "decision_maker_known",
  "implementation_readiness",
  "timeline_known",
  "budget_fit",
  "service_fit",
  "next_step_committed",
] as const;

export type QualificationFlagId = (typeof QUALIFICATION_FLAG_IDS)[number];

export type QualificationFlag = {
  id: QualificationFlagId;
  label: string;
  confirmed: boolean;
  /** Profile key when derived from qualification_profile; null for evidence-only flags. */
  profileKey: QualificationProfileTextKey | null;
};

/** Pitch only when at least this many of 10 flags are confirmed. */
export const DISCOVERY_COMPLETE_THRESHOLD = 6;

const PROFILE_FLAG_MAP: ReadonlyArray<{
  id: Exclude<QualificationFlagId, "next_step_committed">;
  profileKey: QualificationProfileTextKey;
  label: string;
}> = [
  { id: "pain_confirmed", profileKey: "currentWorkflow", label: "Pain / workflow problem confirmed" },
  { id: "impact_quantified", profileKey: "businessImpact", label: "Business impact quantified" },
  { id: "systems_identified", profileKey: "existingSystems", label: "Existing systems identified" },
  {
    id: "automation_opportunity",
    profileKey: "automationOpportunity",
    label: "Automation opportunity named",
  },
  { id: "decision_maker_known", profileKey: "decisionMaker", label: "Decision maker known" },
  {
    id: "implementation_readiness",
    profileKey: "implementationReadiness",
    label: "Implementation readiness gauged",
  },
  { id: "timeline_known", profileKey: "urgencyTimeline", label: "Urgency / timeline known" },
  { id: "budget_fit", profileKey: "budgetFit", label: "Budget / commercial fit checked" },
  { id: "service_fit", profileKey: "recommendedService", label: "AION service fit recommended" },
];

export type QualificationEvidence = {
  /** Explicit commitment captured on the call or follow-up. */
  nextStepCommitted?: boolean;
  /** Free-text next action that implies a committed step when non-empty. */
  nextAction?: string;
};

export type QualificationEngineState = {
  flags: QualificationFlag[];
  confirmed: number;
  total: number;
  /** confirmed/total as 0–100 */
  percent: number;
  discoveryComplete: boolean;
  missing: QualificationFlag[];
};

export type CopilotPolicyStance =
  | "continue_discovery"
  | "quantify_impact"
  | "narrow_service"
  | "advance_opportunity";

export type CopilotPolicy = {
  stance: CopilotPolicyStance;
  /** Never pitch when discovery is incomplete. */
  allowPitch: boolean;
  confirmed: number;
  total: number;
  rationale: string;
  /** Single highest-leverage question for the rep. */
  primaryQuestion: string;
  /** Short next move for live / prep rails. */
  primaryMove: string;
  focusFlagId: QualificationFlagId | null;
};

function profileFilled(
  profile: QualificationProfile | undefined | null,
  key: Exclude<keyof QualificationProfile, "economicImpact">,
): boolean {
  const value = profile?.[key];
  return typeof value === "string" && value.trim().length > 0;
}

function nextStepFromEvidence(evidence?: QualificationEvidence): boolean {
  if (evidence?.nextStepCommitted === true) return true;
  return Boolean(evidence?.nextAction?.trim());
}

/**
 * Derive boolean qualification state from profile + optional commitment evidence.
 */
export function deriveQualificationState(
  profile?: QualificationProfile | null,
  evidence?: QualificationEvidence,
): QualificationEngineState {
  const flags: QualificationFlag[] = PROFILE_FLAG_MAP.map((row) => {
    const fromText = profileFilled(profile, row.profileKey);
    const fromEconomic =
      row.id === "impact_quantified" && hasQuantifiedEconomicImpact(profile?.economicImpact);
    return {
      id: row.id,
      label: row.label,
      profileKey: row.profileKey,
      confirmed: fromText || fromEconomic,
    };
  });

  flags.push({
    id: "next_step_committed",
    label: "Next step committed",
    profileKey: null,
    confirmed: nextStepFromEvidence(evidence),
  });

  const confirmed = flags.filter((f) => f.confirmed).length;
  const total = flags.length;
  const missing = flags.filter((f) => !f.confirmed);

  return {
    flags,
    confirmed,
    total,
    percent: total === 0 ? 0 : Math.round((confirmed / total) * 100),
    discoveryComplete: confirmed >= DISCOVERY_COMPLETE_THRESHOLD,
    missing,
  };
}

function impactQuestion(lead: Lead, context: BusinessContext): string {
  const dimension = QUALIFICATION_DIMENSIONS.find((d) => d.profileKey === "businessImpact");
  return dimension?.question(lead, context) ?? "What does this problem cost the business in a typical week?";
}

function questionForFlag(
  flagId: QualificationFlagId,
  lead: Lead,
  context: BusinessContext,
): string {
  if (flagId === "next_step_committed") {
    return `What concrete next step should we lock for ${lead.companyName} before we hang up?`;
  }
  const mapped = PROFILE_FLAG_MAP.find((row) => row.id === flagId);
  if (!mapped) {
    return impactQuestion(lead, context);
  }
  const dimension = QUALIFICATION_DIMENSIONS.find((d) => d.profileKey === mapped.profileKey);
  return dimension?.question(lead, context) ?? impactQuestion(lead, context);
}

/**
 * Copilot policy over qualification state.
 * Rule: confirmed < 6/10 → do not pitch → push impact (or next missing flag).
 */
export function evaluateCopilotPolicy(input: {
  state: QualificationEngineState;
  lead: Lead;
  context: BusinessContext;
}): CopilotPolicy {
  const { state, lead, context } = input;
  const impactConfirmed = state.flags.find((f) => f.id === "impact_quantified")?.confirmed ?? false;
  const serviceConfirmed = state.flags.find((f) => f.id === "service_fit")?.confirmed ?? false;
  const nextCommitted =
    state.flags.find((f) => f.id === "next_step_committed")?.confirmed ?? false;

  if (state.confirmed < DISCOVERY_COMPLETE_THRESHOLD) {
    const focus: QualificationFlagId = impactConfirmed
      ? (state.missing[0]?.id ?? "pain_confirmed")
      : "impact_quantified";
    const primaryQuestion = questionForFlag(focus, lead, context);
    return {
      stance: impactConfirmed ? "continue_discovery" : "quantify_impact",
      allowPitch: false,
      confirmed: state.confirmed,
      total: state.total,
      rationale: `${state.confirmed}/${state.total} confirmed — discovery incomplete; do not pitch.`,
      primaryQuestion,
      primaryMove: impactConfirmed
        ? `Stay in discovery. Cover: ${state.missing[0]?.label ?? "remaining gaps"}.`
        : "Do not pitch. Quantify weekly business impact before naming AION services.",
      focusFlagId: focus,
    };
  }

  if (!serviceConfirmed) {
    const primaryQuestion = questionForFlag("service_fit", lead, context);
    return {
      stance: "narrow_service",
      allowPitch: false,
      confirmed: state.confirmed,
      total: state.total,
      rationale: `${state.confirmed}/${state.total} confirmed — discovery threshold met, but service fit is still open.`,
      primaryQuestion,
      primaryMove: "Narrow the AION service recommendation before a commercial pitch.",
      focusFlagId: "service_fit",
    };
  }

  if (!nextCommitted) {
    const primaryQuestion = questionForFlag("next_step_committed", lead, context);
    return {
      stance: "advance_opportunity",
      allowPitch: true,
      confirmed: state.confirmed,
      total: state.total,
      rationale: `${state.confirmed}/${state.total} confirmed — ready to propose the next funnel step.`,
      primaryQuestion,
      primaryMove: `Propose the next step for ${
        context.recommendedService ?? "an AION engagement"
      }: audit, diagnosis, scope, or proposal.`,
      focusFlagId: "next_step_committed",
    };
  }

  return {
    stance: "advance_opportunity",
    allowPitch: true,
    confirmed: state.confirmed,
    total: state.total,
    rationale: `${state.confirmed}/${state.total} confirmed — next step locked; advance the opportunity.`,
    primaryQuestion: `What would make ${lead.companyName} confident moving from qualified opportunity into scope?`,
    primaryMove: "Confirm stage advancement and schedule the scoped follow-up.",
    focusFlagId: null,
  };
}

export function buildQualificationEngine(input: {
  lead: Lead;
  context: BusinessContext;
  profile?: QualificationProfile | null;
  evidence?: QualificationEvidence;
}): { state: QualificationEngineState; policy: CopilotPolicy } {
  const state = deriveQualificationState(input.profile, input.evidence);
  const policy = evaluateCopilotPolicy({
    state,
    lead: input.lead,
    context: input.context,
  });
  return { state, policy };
}
