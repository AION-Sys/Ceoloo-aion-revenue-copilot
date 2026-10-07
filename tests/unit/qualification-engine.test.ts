import { describe, expect, it } from "vitest";
import {
  DISCOVERY_COMPLETE_THRESHOLD,
  buildQualificationEngine,
  deriveQualificationState,
  evaluateCopilotPolicy,
} from "@/lib/sales/qualification-engine";
import type { BusinessContext, Lead, QualificationProfile } from "@/lib/sales/types";

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme HVAC",
  status: "business_audit",
};

const context: BusinessContext = {
  id: "ctx-1",
  organizationId: "org-1",
  industry: "home services",
  existingSystems: ["QuickBooks"],
  workflowProblems: ["delayed follow-up after estimates"],
  recommendedService: "workflow automation implementation",
};

const thinProfile: QualificationProfile = {
  currentWorkflow: "Manual phone chase",
  businessImpact: "",
};

const midProfile: QualificationProfile = {
  currentWorkflow: "Manual phone chase",
  businessImpact: "$4k jobs delayed weekly",
  existingSystems: "Phone + QuickBooks",
  automationOpportunity: "Lead intake → follow-up sequence",
  decisionMaker: "Jordan (owner)",
};

const richProfile: QualificationProfile = {
  ...midProfile,
  implementationReadiness: "Ready this quarter",
  urgencyTimeline: "30 days",
  budgetFit: "Will review proposal",
  recommendedService: "workflow automation implementation",
};

describe("deriveQualificationState", () => {
  it("maps profile fields onto boolean flags with a 10-slot total", () => {
    const state = deriveQualificationState(midProfile);
    expect(state.total).toBe(10);
    expect(state.confirmed).toBe(5);
    expect(state.discoveryComplete).toBe(false);
    expect(state.flags.find((f) => f.id === "impact_quantified")?.confirmed).toBe(true);
    expect(state.flags.find((f) => f.id === "next_step_committed")?.confirmed).toBe(false);
  });

  it("treats nextAction evidence as next_step_committed", () => {
    const state = deriveQualificationState(richProfile, {
      nextAction: "Book Revenue Systems Assessment Thursday 2pm",
    });
    expect(state.confirmed).toBe(10);
    expect(state.discoveryComplete).toBe(true);
    expect(state.flags.find((f) => f.id === "next_step_committed")?.confirmed).toBe(true);
  });
});

describe("evaluateCopilotPolicy", () => {
  it("blocks pitch and asks impact when confirmed < 6/10 and impact missing", () => {
    const state = deriveQualificationState(thinProfile);
    expect(state.confirmed).toBeLessThan(DISCOVERY_COMPLETE_THRESHOLD);

    const policy = evaluateCopilotPolicy({ state, lead, context });
    expect(policy.allowPitch).toBe(false);
    expect(policy.stance).toBe("quantify_impact");
    expect(policy.focusFlagId).toBe("impact_quantified");
    expect(policy.rationale).toMatch(/do not pitch/i);
    expect(policy.primaryQuestion.toLowerCase()).toMatch(/cost|impact/);
  });

  it("blocks pitch and continues discovery when impact exists but still under threshold", () => {
    const state = deriveQualificationState(midProfile);
    expect(state.confirmed).toBe(5);
    const policy = evaluateCopilotPolicy({ state, lead, context });
    expect(policy.allowPitch).toBe(false);
    expect(policy.stance).toBe("continue_discovery");
    expect(policy.focusFlagId).toBeTruthy();
  });

  it("allows proposing the next step once threshold + service fit are met", () => {
    const state = deriveQualificationState(richProfile);
    expect(state.confirmed).toBeGreaterThanOrEqual(DISCOVERY_COMPLETE_THRESHOLD);
    const policy = evaluateCopilotPolicy({ state, lead, context });
    expect(policy.allowPitch).toBe(true);
    expect(policy.stance).toBe("advance_opportunity");
    expect(policy.primaryMove.toLowerCase()).toMatch(/next step|propose/);
  });
});

describe("buildQualificationEngine", () => {
  it("returns paired state + policy for cockpit surfaces", () => {
    const { state, policy } = buildQualificationEngine({
      lead,
      context,
      profile: midProfile,
    });
    expect(state.percent).toBe(50);
    expect(policy.allowPitch).toBe(false);
  });
});
