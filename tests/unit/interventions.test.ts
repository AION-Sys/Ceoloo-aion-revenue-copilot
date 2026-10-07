import { afterEach, describe, expect, it } from "vitest";
import {
  applyInterventionFeedback,
  buildInterventionId,
  createIntervention,
  interventionToLearningSignal,
  listInterventions,
  clearInterventionStore,
  upsertIntervention,
} from "@/lib/learning/interventions";
import {
  clearAllLocalBanks,
  episodeFromIntervention,
  listLocalEpisodes,
  retainInterventionLearning,
} from "@/lib/learning/memory";

afterEach(() => {
  clearInterventionStore();
  clearAllLocalBanks();
});

describe("buildInterventionId", () => {
  it("is stable for the same kind + call + recommendation", () => {
    const a = buildInterventionId({
      kind: "next_best_action",
      callId: "call-1",
      recommendation: "Ask for quantified monthly lead leak",
    });
    const b = buildInterventionId({
      kind: "next_best_action",
      callId: "call-1",
      recommendation: "Ask for quantified monthly lead leak",
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^ivn-next_best_action-/);
  });

  it("differs when recommendation or call changes", () => {
    const a = buildInterventionId({
      kind: "objection_reframe",
      callId: "call-1",
      recommendation: "Reframe tools objection",
    });
    const b = buildInterventionId({
      kind: "objection_reframe",
      callId: "call-2",
      recommendation: "Reframe tools objection",
    });
    const c = buildInterventionId({
      kind: "objection_reframe",
      callId: "call-1",
      recommendation: "Different reframe",
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("createIntervention + feedback", () => {
  it("creates lineage with null usefulness until captured", () => {
    const record = createIntervention({
      kind: "objection_reframe",
      pattern: "We already have tools",
      recommendation: "Reframe to implementation partner, not more tools",
      callId: "call-1",
      leadId: "lead-1",
      organizationId: "org-1",
      stageBefore: "lead",
      occurredAt: "2026-10-07T15:00:00.000Z",
    });

    expect(record.interventionId).toMatch(/^ivn-objection_reframe-/);
    expect(record.repUsed).toBeNull();
    expect(record.useful).toBeNull();
    expect(record.stageBefore).toBe("lead");
    expect(record.revenueCents).toBeUndefined();
  });

  it("records rep_used, useful, stage after, and outcome without inventing revenue", () => {
    const created = createIntervention({
      kind: "next_best_action",
      recommendation: "Quantify delayed follow-ups",
      callId: "call-1",
      leadId: "lead-1",
      stageBefore: "lead",
      occurredAt: "2026-10-07T15:00:00.000Z",
    });

    const updated = applyInterventionFeedback(created, {
      repUsed: true,
      useful: true,
      prospectResponse: "Owner shared ~9 delayed follow-ups/month",
      stageAfter: "business_audit",
      eventualOutcome: "Booked Revenue Systems Assessment",
    });

    expect(updated.repUsed).toBe(true);
    expect(updated.useful).toBe(true);
    expect(updated.stageAfter).toBe("business_audit");
    expect(updated.eventualOutcome).toContain("Assessment");
    expect(updated.revenueCents).toBeUndefined();
  });

  it("maps to LearningSignal with interventionId", () => {
    const record = createIntervention({
      kind: "next_best_action",
      recommendation: "Stay in discovery — ask impact",
      callId: "call-1",
      leadId: "lead-1",
      stageBefore: "lead",
      occurredAt: "2026-10-07T15:00:00.000Z",
    });
    const withFeedback = applyInterventionFeedback(record, {
      useful: true,
      repUsed: true,
      stageAfter: "business_audit",
      eventualOutcome: "Audit booked",
    });

    const signal = interventionToLearningSignal(withFeedback, {
      title: "Acme HVAC · exploring",
      detail: "Impact question kept discovery open",
      companyName: "Acme HVAC",
    });

    expect(signal.interventionId).toBe(withFeedback.interventionId);
    expect(signal.intervention).toBe("Stay in discovery — ask impact");
    expect(signal.useful).toBe(true);
    expect(signal.repUsed).toBe(true);
    expect(signal.stageFrom).toBe("lead");
    expect(signal.stageTo).toBe("business_audit");
  });
});

describe("retain intervention into learning memory", () => {
  it("retains episode with intervention_id metadata", async () => {
    const record = createIntervention({
      kind: "objection_reframe",
      pattern: "too expensive",
      recommendation: "Compare manual leak cost vs assessment",
      callId: "call-1",
      leadId: "lead-1",
      organizationId: "org-ivn",
      stageBefore: "lead",
      occurredAt: "2026-10-07T16:00:00.000Z",
    });
    upsertIntervention(record);

    const result = await retainInterventionLearning(record, {
      adapterId: "local",
      bankId: "bank-ivn-1",
    });

    expect(result.accepted).toBe(true);
    const episodes = listLocalEpisodes("bank-ivn-1");
    expect(episodes).toHaveLength(1);
    expect(episodes[0]?.kind).toBe("intervention");
    expect(episodes[0]?.metadata?.interventionId).toBe(record.interventionId);
    expect(episodes[0]?.content).toMatch(/too expensive/i);

    const fromEpisode = episodeFromIntervention(record);
    expect(fromEpisode.id).toContain(record.interventionId);
  });

  it("upserts feedback into the intervention store", () => {
    const record = createIntervention({
      kind: "discovery_question",
      recommendation: "Who owns follow-up after estimates?",
      callId: "call-9",
      leadId: "lead-9",
      occurredAt: "2026-10-07T17:00:00.000Z",
    });
    upsertIntervention(record);
    const updated = applyInterventionFeedback(record, { useful: false, repUsed: false });
    upsertIntervention(updated);

    const listed = listInterventions({ callId: "call-9" });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.useful).toBe(false);
    expect(listed[0]?.repUsed).toBe(false);
  });
});
