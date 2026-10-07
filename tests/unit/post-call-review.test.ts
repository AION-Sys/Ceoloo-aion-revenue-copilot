import { describe, expect, it } from "vitest";
import { buildPostCallReview } from "@/lib/cockpit/post-call-review";
import type { BusinessContext, CallOutcome, Lead, QualificationProfile } from "@/lib/sales/types";

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme HVAC",
  contactName: "Jordan",
  status: "lead",
};

const context: BusinessContext = {
  id: "ctx-1",
  organizationId: "org-1",
  industry: "home services",
  existingSystems: ["QuickBooks", "phone"],
  workflowProblems: ["manual lead follow-up"],
  recommendedService: "workflow automation implementation",
};

const priorProfile: QualificationProfile = {
  currentWorkflow: "Phone chase after estimates",
};

const outcome: CallOutcome = {
  id: "outcome-1",
  leadId: "lead-1",
  painPoints: ["manual lead follow-up", "no shared job status"],
  objections: [
    { objection: "We already have tools", suggestedReframe: "Quantify after-hours leak", resolved: false },
  ],
  qualification: "qualified",
  qualificationProfile: {
    currentWorkflow: "Phone chase after estimates",
    businessImpact: "Nine delayed follow-ups/month ~ $8k exposure",
    existingSystems: "QuickBooks + phone",
    automationOpportunity: "Lead intake → follow-up sequence",
    decisionMaker: "Jordan (owner)",
    implementationReadiness: "Ready this quarter",
    urgencyTimeline: "30 days",
    budgetFit: "Will review assessment pricing",
    recommendedService: "Revenue Systems Assessment",
  },
  nextAction: "Revenue Systems Assessment — Thursday 2:00 PM",
  transcriptSummary: "Confirmed impact and owner; tools objection reframed around disconnects.",
  occurredAt: "2026-10-07T15:00:00.000Z",
};

describe("buildPostCallReview", () => {
  it("assembles the canonical review artifact from an outcome", () => {
    const review = buildPostCallReview({
      callId: "call-1",
      lead,
      context,
      outcome,
      priorProfile,
      buyingSignals: [
        {
          id: "sig-1",
          text: "If you could connect QuickBooks we'd be interested",
          strength: "strong",
          source: "rep_capture",
        },
      ],
      commitments: [
        {
          id: "cmt-1",
          text: "Jordan will join Thursday assessment",
          owner: "prospect",
          dueLabel: "Thursday 2pm",
        },
      ],
    });

    expect(review.id).toBe("review-outcome-1");
    expect(review.companyName).toBe("Acme HVAC");
    expect(review.learned.length).toBeGreaterThan(2);
    expect(review.evidence.painPoints).toContain("manual lead follow-up");
    expect(review.recommendation.stageFrom).toBe("lead");
    expect(review.recommendation.stageTo).toBe("qualified_opportunity");
    expect(review.recommendation.stageToLabel).toBe("Qualified Opportunity");
    expect(review.recommendation.nextAction).toContain("Revenue Systems Assessment");
    expect(review.followUp.evidenceState).toBe("draft");
    expect(review.crmProposals.length).toBeGreaterThanOrEqual(1);
    expect(review.proposedCrmChangeCount).toBe(review.crmProposals.length);
    expect(review.allCrmDraft).toBe(true);
    expect(review.buyingSignals).toHaveLength(1);
    expect(review.commitments).toHaveLength(1);
    expect(review.policy.allowPitch).toBe(true);
  });

  it("records qualification deltas from prior → after", () => {
    const review = buildPostCallReview({
      callId: "call-1",
      lead,
      context,
      outcome,
      priorProfile,
    });

    const impact = review.qualificationDeltas.find((d) => d.flagId === "impact_quantified");
    expect(impact).toEqual(
      expect.objectContaining({
        before: false,
        after: true,
        changed: true,
      }),
    );
    expect(review.qualificationAfter.confirmed).toBeGreaterThan(
      review.qualificationBefore.confirmed,
    );
  });

  it("keeps CRM proposals as drafts for governed approval", () => {
    const review = buildPostCallReview({
      callId: "call-1",
      lead,
      context,
      outcome,
    });
    expect(review.crmProposals.every((p) => p.evidenceState === "draft")).toBe(true);
    expect(review.followUp.evidenceState).toBe("draft");
  });
});
