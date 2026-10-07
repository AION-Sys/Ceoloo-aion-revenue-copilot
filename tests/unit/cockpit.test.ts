import { describe, expect, it } from "vitest";
import {
  approveCrmProposal,
  buildCrmProposalsFromOutcome,
  confirmCrmProposal,
} from "@/lib/cockpit/crm-proposals";
import {
  approveFollowUpDraft,
  buildFollowUpDraftFromOutcome,
  confirmFollowUpDraft,
} from "@/lib/cockpit/follow-up";
import { buildLineageTrail } from "@/lib/cockpit/lineage";
import { buildCallPrepSurface } from "@/lib/cockpit/prep";
import { scoreQualificationCompleteness } from "@/lib/cockpit/qualification";
import { qualificationToLeadStatus } from "@/lib/crm/status";
import type { CallOutcome, Lead } from "@/lib/sales/types";

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme HVAC",
  contactName: "Jordan",
  source: "outbound",
  status: "lead",
};

const outcome: CallOutcome = {
  id: "outcome-1",
  leadId: "lead-1",
  painPoints: ["manual follow-up"],
  objections: [],
  qualification: "exploring",
  nextAction: "send audit agenda",
  occurredAt: "2026-10-07T12:00:00.000Z",
};

describe("cockpit qualification completeness", () => {
  it("scores gaps across AION dimensions", () => {
    const score = scoreQualificationCompleteness({
      currentWorkflow: "spreadsheets",
      businessImpact: "lost leads",
    });
    expect(score.filled).toBe(2);
    expect(score.total).toBe(9);
    expect(score.gaps.length).toBe(7);
  });
});

describe("funnel mapping (Product Lab)", () => {
  it("maps qualification onto FunnelStage", () => {
    expect(qualificationToLeadStatus("unqualified")).toBe("business_audit");
    expect(qualificationToLeadStatus("exploring")).toBe("business_audit");
    expect(qualificationToLeadStatus("qualified")).toBe("qualified_opportunity");
    expect(qualificationToLeadStatus("disqualified")).toBe("closed_won");
  });
});

describe("call prep surface", () => {
  it("includes objective, gaps, and objections", () => {
    const prep = buildCallPrepSurface({
      lead,
      context: {
        id: "ctx-1",
        organizationId: "org-1",
        industry: "home services",
        existingSystems: ["QuickBooks"],
        workflowProblems: ["manual lead follow-up"],
        recommendedService: "workflow automation implementation",
      },
      profile: { currentWorkflow: "phone only" },
    });
    expect(prep.objective.toLowerCase()).toMatch(/discovery|manual lead follow-up/);
    expect(prep.policy?.allowPitch).toBe(false);
    expect(prep.missingInformation.length).toBeGreaterThan(0);
    expect(prep.likelyObjections.length).toBeGreaterThan(0);
    expect(prep.recommendedQuestions.length).toBeGreaterThan(0);
    expect(prep.recommendedQuestions[0]?.toLowerCase()).toMatch(/cost|impact/);
  });
});

describe("CRM draft vs confirmed", () => {
  it("requires external id to confirm", () => {
    const [proposal] = buildCrmProposalsFromOutcome({ lead, outcome });
    expect(proposal.evidenceState).toBe("draft");
    const approved = approveCrmProposal(proposal);
    expect(approved.evidenceState).toBe("approved");
    expect(confirmCrmProposal(approved, "").evidenceState).toBe("approved");
    expect(confirmCrmProposal(approved, "ghl-note-1").evidenceState).toBe("confirmed");
  });
});

describe("follow-up draft vs confirmed", () => {
  it("never confirms without provider id", () => {
    const draft = buildFollowUpDraftFromOutcome({ lead, outcome });
    expect(draft.evidenceState).toBe("draft");
    const approved = approveFollowUpDraft(draft);
    expect(confirmFollowUpDraft(approved, "").evidenceState).toBe("approved");
    expect(confirmFollowUpDraft(approved, "msg-99").externalConfirmationId).toBe(
      "msg-99",
    );
  });
});

describe("lineage trail", () => {
  it("orders conversation → outcome", () => {
    const trail = buildLineageTrail({
      leadId: "lead-1",
      hasConversation: true,
      hasEvidence: true,
      recommendation: "send audit agenda",
      repDecision: "Saved exploring outcome",
      crmProposal: buildCrmProposalsFromOutcome({ lead, outcome })[0],
      outcome,
    });
    expect(trail.steps.map((step) => step.id)).toEqual([
      "conversation",
      "evidence",
      "recommendation",
      "rep_decision",
      "crm_action",
      "outcome",
    ]);
    expect(trail.steps[0]?.status).toBe("done");
    expect(trail.steps[5]?.status).toBe("done");
  });
});
