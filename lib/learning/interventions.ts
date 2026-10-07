import type { LearningSignal } from "@/lib/cockpit/types";
import type { FunnelStage } from "@/lib/sales/types";

/**
 * Measurable Copilot interventions (finish-line P0).
 *
 * Lineage: intervention_id → objection/pattern → recommendation →
 * rep_used → prospect_response → stage_before/after → eventual_outcome → revenue
 *
 * Revenue stays unset until a real attribution exists — never invent ROI.
 */

export const INTERVENTION_KINDS = [
  "next_best_action",
  "objection_reframe",
  "discovery_question",
  "follow_up",
] as const;

export type InterventionKind = (typeof INTERVENTION_KINDS)[number];

export type InterventionRecord = {
  interventionId: string;
  kind: InterventionKind;
  /** Objection text or discovery pattern that triggered the intervention. */
  pattern?: string;
  recommendation: string;
  /** Whether the rep used / acted on the recommendation. */
  repUsed: boolean | null;
  prospectResponse?: string;
  stageBefore?: FunnelStage;
  stageAfter?: FunnelStage;
  eventualOutcome?: string;
  /** Revenue attribution in cents when known — omit until real. */
  revenueCents?: number | null;
  useful: boolean | null;
  callId?: string;
  leadId?: string;
  organizationId?: string;
  occurredAt: string;
};

export type CreateInterventionInput = {
  kind: InterventionKind;
  recommendation: string;
  pattern?: string;
  callId?: string;
  leadId?: string;
  organizationId?: string;
  stageBefore?: FunnelStage;
  occurredAt?: string;
  /** Override stable id (tests / replay). */
  interventionId?: string;
};

export type InterventionFeedback = {
  repUsed?: boolean | null;
  useful?: boolean | null;
  prospectResponse?: string;
  stageAfter?: FunnelStage;
  eventualOutcome?: string;
  revenueCents?: number | null;
};

const store = new Map<string, InterventionRecord>();

export function buildInterventionId(input: {
  kind: InterventionKind;
  recommendation: string;
  callId?: string;
  leadId?: string;
}): string {
  const scope = input.callId?.trim() || input.leadId?.trim() || "global";
  const rec = slug(input.recommendation).slice(0, 64) || "rec";
  return `ivn-${input.kind}-${slug(scope)}-${rec}`.slice(0, 140);
}

export function createIntervention(input: CreateInterventionInput): InterventionRecord {
  const recommendation = input.recommendation.trim();
  const interventionId =
    input.interventionId?.trim() ||
    buildInterventionId({
      kind: input.kind,
      recommendation,
      callId: input.callId,
      leadId: input.leadId,
    });

  return {
    interventionId,
    kind: input.kind,
    pattern: input.pattern?.trim() || undefined,
    recommendation,
    repUsed: null,
    useful: null,
    callId: input.callId,
    leadId: input.leadId,
    organizationId: input.organizationId,
    stageBefore: input.stageBefore,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}

export function applyInterventionFeedback(
  record: InterventionRecord,
  feedback: InterventionFeedback,
): InterventionRecord {
  return {
    ...record,
    repUsed: feedback.repUsed !== undefined ? feedback.repUsed : record.repUsed,
    useful: feedback.useful !== undefined ? feedback.useful : record.useful,
    prospectResponse:
      feedback.prospectResponse !== undefined
        ? feedback.prospectResponse.trim() || undefined
        : record.prospectResponse,
    stageAfter: feedback.stageAfter !== undefined ? feedback.stageAfter : record.stageAfter,
    eventualOutcome:
      feedback.eventualOutcome !== undefined
        ? feedback.eventualOutcome.trim() || undefined
        : record.eventualOutcome,
    revenueCents:
      feedback.revenueCents !== undefined ? feedback.revenueCents : record.revenueCents,
  };
}

export function upsertIntervention(record: InterventionRecord): InterventionRecord {
  store.set(record.interventionId, record);
  return record;
}

export function getIntervention(interventionId: string): InterventionRecord | undefined {
  return store.get(interventionId);
}

export function listInterventions(filter?: {
  callId?: string;
  leadId?: string;
  organizationId?: string;
}): InterventionRecord[] {
  const all = [...store.values()];
  return all
    .filter((item) => {
      if (filter?.callId && item.callId !== filter.callId) return false;
      if (filter?.leadId && item.leadId !== filter.leadId) return false;
      if (filter?.organizationId && item.organizationId !== filter.organizationId) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export function clearInterventionStore(): void {
  store.clear();
}

export function interventionToLearningSignal(
  record: InterventionRecord,
  extras?: {
    title?: string;
    detail?: string;
    companyName?: string;
  },
): LearningSignal {
  return {
    id: record.interventionId,
    interventionId: record.interventionId,
    title:
      extras?.title ??
      `${extras?.companyName ?? "Prospect"} · ${record.kind.replace(/_/g, " ")}`,
    detail:
      extras?.detail ??
      record.pattern ??
      record.prospectResponse ??
      "Copilot intervention shown to rep",
    intervention: record.recommendation,
    outcome: record.eventualOutcome ?? record.recommendation,
    stageFrom: record.stageBefore,
    stageTo: record.stageAfter,
    useful: record.useful,
    repUsed: record.repUsed,
    pattern: record.pattern,
    occurredAt: record.occurredAt,
  };
}

/**
 * Build interventions from live guidance recommendations (shown → retainable).
 */
export function interventionsFromGuidance(input: {
  callId: string;
  leadId: string;
  organizationId: string;
  stageBefore?: FunnelStage;
  nextBestAction: string;
  nextBestQuestion?: string;
  objection?: string;
  objectionReframe?: string;
  occurredAt?: string;
}): InterventionRecord[] {
  const when = input.occurredAt ?? new Date().toISOString();
  const records: InterventionRecord[] = [];

  if (input.nextBestAction.trim()) {
    records.push(
      createIntervention({
        kind: "next_best_action",
        recommendation: input.nextBestAction,
        callId: input.callId,
        leadId: input.leadId,
        organizationId: input.organizationId,
        stageBefore: input.stageBefore,
        occurredAt: when,
      }),
    );
  }

  if (input.nextBestQuestion?.trim()) {
    records.push(
      createIntervention({
        kind: "discovery_question",
        recommendation: input.nextBestQuestion,
        pattern: "discovery_gap",
        callId: input.callId,
        leadId: input.leadId,
        organizationId: input.organizationId,
        stageBefore: input.stageBefore,
        occurredAt: when,
      }),
    );
  }

  if (input.objectionReframe?.trim()) {
    records.push(
      createIntervention({
        kind: "objection_reframe",
        recommendation: input.objectionReframe,
        pattern: input.objection?.trim() || undefined,
        callId: input.callId,
        leadId: input.leadId,
        organizationId: input.organizationId,
        stageBefore: input.stageBefore,
        occurredAt: when,
      }),
    );
  }

  return records;
}

function slug(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "na"
  );
}
