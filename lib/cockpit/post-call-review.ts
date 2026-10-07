import { buildCrmProposalsFromOutcome } from "@/lib/cockpit/crm-proposals";
import { buildFollowUpDraftFromOutcome } from "@/lib/cockpit/follow-up";
import type {
  BuyingSignal,
  Commitment,
  CrmChangeProposal,
  FollowUpDraft,
} from "@/lib/cockpit/types";
import { qualificationToLeadStatus } from "@/lib/crm/status";
import {
  formatEconomicImpactSummary,
  hasQuantifiedEconomicImpact,
} from "@/lib/sales/economic-impact";
import { FUNNEL_STAGE_LABELS } from "@/lib/sales/motion";
import {
  buildQualificationEngine,
  deriveQualificationState,
  type CopilotPolicy,
  type QualificationEngineState,
  type QualificationFlag,
} from "@/lib/sales/qualification-engine";
import type {
  BusinessContext,
  CallOutcome,
  EconomicImpact,
  FunnelStage,
  Lead,
  ObjectionRecord,
  QualificationProfile,
  QualificationState,
} from "@/lib/sales/types";

export type QualificationDelta = {
  flagId: QualificationFlag["id"];
  label: string;
  before: boolean;
  after: boolean;
  changed: boolean;
};

export type PostCallReviewEvidence = {
  painPoints: string[];
  transcriptSummary?: string;
  workflowProblems: string[];
  existingSystems: string[];
  economicImpact?: EconomicImpact;
  economicImpactSummary?: string;
};

export type PostCallReviewRecommendation = {
  stageFrom: FunnelStage;
  stageTo: FunnelStage;
  stageToLabel: string;
  qualification: QualificationState;
  nextAction: string;
  serviceHint?: string;
};

/**
 * Canonical post-call review artifact.
 * conversation → evidence → recommendation → rep decision → CRM action → outcome
 */
export type PostCallReview = {
  id: string;
  callId: string;
  leadId: string;
  companyName: string;
  occurredAt: string;
  /** Short bullets of what the Copilot learned this call. */
  learned: string[];
  evidence: PostCallReviewEvidence;
  qualificationBefore: QualificationEngineState;
  qualificationAfter: QualificationEngineState;
  qualificationDeltas: QualificationDelta[];
  objections: ObjectionRecord[];
  buyingSignals: BuyingSignal[];
  commitments: Commitment[];
  recommendation: PostCallReviewRecommendation;
  policy: CopilotPolicy;
  followUp: FollowUpDraft;
  crmProposals: CrmChangeProposal[];
  /** Draft CRM mutation count awaiting human approval. */
  proposedCrmChangeCount: number;
  /** True when every CRM proposal is still draft (nothing externally confirmed). */
  allCrmDraft: boolean;
};

export type BuildPostCallReviewInput = {
  callId: string;
  lead: Lead;
  context: BusinessContext;
  outcome: CallOutcome;
  /** Profile known before this call (prospect workspace / prior outcome). */
  priorProfile?: QualificationProfile | null;
  buyingSignals?: BuyingSignal[];
  commitments?: Commitment[];
};

function buildLearnedBullets(input: {
  outcome: CallOutcome;
  deltas: QualificationDelta[];
  policy: CopilotPolicy;
}): string[] {
  const bullets: string[] = [];
  const newlyConfirmed = input.deltas.filter((d) => !d.before && d.after);
  for (const delta of newlyConfirmed.slice(0, 4)) {
    bullets.push(`Confirmed: ${delta.label}`);
  }
  if (input.outcome.painPoints.filter((p) => p.trim()).length > 0) {
    bullets.push(`Pains captured: ${input.outcome.painPoints.filter((p) => p.trim()).join("; ")}`);
  }
  const economic = input.outcome.qualificationProfile?.economicImpact;
  if (hasQuantifiedEconomicImpact(economic)) {
    bullets.push(`Economic impact: ${formatEconomicImpactSummary(economic!)}`);
  }
  if (input.outcome.objections.some((o) => o.objection.trim())) {
    const open = input.outcome.objections.filter((o) => o.objection.trim() && !o.resolved);
    bullets.push(
      open.length
        ? `Open objections: ${open.map((o) => o.objection).join("; ")}`
        : "Objections recorded (resolved on call)",
    );
  }
  bullets.push(input.policy.rationale);
  if (input.outcome.nextAction.trim()) {
    bullets.push(`Next action: ${input.outcome.nextAction.trim()}`);
  }
  return bullets;
}

function buildDeltas(
  before: QualificationEngineState,
  after: QualificationEngineState,
): QualificationDelta[] {
  return after.flags.map((flag) => {
    const prior = before.flags.find((f) => f.id === flag.id);
    const beforeConfirmed = prior?.confirmed ?? false;
    return {
      flagId: flag.id,
      label: flag.label,
      before: beforeConfirmed,
      after: flag.confirmed,
      changed: beforeConfirmed !== flag.confirmed,
    };
  });
}

/**
 * Build the single post-call review object from a saved outcome + context.
 */
export function buildPostCallReview(input: BuildPostCallReviewInput): PostCallReview {
  const { lead, context, outcome, callId } = input;
  const priorProfile = input.priorProfile ?? null;
  const afterEvidence = {
    nextAction: outcome.nextAction,
    nextStepCommitted: Boolean(outcome.nextAction.trim()),
  };

  const qualificationBefore = deriveQualificationState(priorProfile);
  const { state: qualificationAfter, policy } = buildQualificationEngine({
    lead,
    context,
    profile: outcome.qualificationProfile,
    evidence: afterEvidence,
  });

  const qualificationDeltas = buildDeltas(qualificationBefore, qualificationAfter);
  const stageFrom = (lead.status ?? "lead") as FunnelStage;
  const stageTo = qualificationToLeadStatus(outcome.qualification);

  const crmProposals = buildCrmProposalsFromOutcome({ lead, outcome });
  const followUp = buildFollowUpDraftFromOutcome({ lead, outcome });

  const economicImpact = outcome.qualificationProfile?.economicImpact;
  const evidence: PostCallReviewEvidence = {
    painPoints: outcome.painPoints.map((p) => p.trim()).filter(Boolean),
    transcriptSummary: outcome.transcriptSummary?.trim() || undefined,
    workflowProblems: [...context.workflowProblems],
    existingSystems: [...context.existingSystems],
    economicImpact,
    economicImpactSummary: economicImpact
      ? formatEconomicImpactSummary(economicImpact)
      : undefined,
  };

  return {
    id: `review-${outcome.id}`,
    callId,
    leadId: lead.id,
    companyName: lead.companyName,
    occurredAt: outcome.occurredAt,
    learned: buildLearnedBullets({ outcome, deltas: qualificationDeltas, policy }),
    evidence,
    qualificationBefore,
    qualificationAfter,
    qualificationDeltas,
    objections: outcome.objections.filter((o) => o.objection.trim()),
    buyingSignals: input.buyingSignals ?? [],
    commitments: input.commitments ?? [],
    recommendation: {
      stageFrom,
      stageTo,
      stageToLabel: FUNNEL_STAGE_LABELS[stageTo],
      qualification: outcome.qualification,
      nextAction: outcome.nextAction.trim(),
      serviceHint:
        outcome.qualificationProfile?.recommendedService?.trim() ||
        context.recommendedService ||
        undefined,
    },
    policy,
    followUp,
    crmProposals,
    proposedCrmChangeCount: crmProposals.length,
    allCrmDraft: crmProposals.every((p) => p.evidenceState === "draft"),
  };
}
