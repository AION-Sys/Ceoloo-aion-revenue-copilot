import { describe, expect, it } from "vitest";
import {
  FUNNEL_STAGES,
  QUALIFICATION_DIMENSIONS,
  buildAgentSystemPrompt,
  buildQualificationQuestions,
  formatFunnelPath,
  normalizeLeadStatus,
} from "@/lib/sales/motion";
import type { BusinessContext, Lead } from "@/lib/sales/types";

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme HVAC",
};

const context: BusinessContext = {
  id: "ctx-1",
  organizationId: "org-1",
  industry: "home services",
  existingSystems: ["spreadsheets"],
  workflowProblems: ["manual lead follow-up"],
  recommendedService: "workflow automation implementation",
};

describe("AION sales motion", () => {
  it("orders the implementation funnel from lead through onboarding", () => {
    expect(formatFunnelPath()).toBe(
      "Lead → Business Audit → Problem/Workflow Diagnosis → Qualified Opportunity → Solution/Implementation Scope → Proposal → Closed Won → Onboarding",
    );
    expect(FUNNEL_STAGES).toHaveLength(8);
  });

  it("qualifies on workflow and implementation fit", () => {
    expect(QUALIFICATION_DIMENSIONS.map((dimension) => dimension.label)).toEqual([
      "Current workflow/problem",
      "Business impact",
      "Existing systems/tools",
      "Automation opportunity",
      "Decision maker",
      "Implementation readiness",
      "Urgency/timeline",
      "Budget/commercial fit",
      "Recommended AION service",
    ]);
  });

  it("instructs the agent with the funnel and forbids funding qualification", () => {
    const prompt = buildAgentSystemPrompt().toLowerCase();

    expect(prompt).toContain(formatFunnelPath().toLowerCase());
    for (const dimension of QUALIFICATION_DIMENSIONS) {
      expect(prompt).toContain(dimension.label.toLowerCase());
    }

    for (const stale of [
      "annual revenue",
      "capital need",
      "funding urgency",
      "bank statement",
      "underwriting",
      "funding decision authority",
    ]) {
      expect(prompt).not.toContain(stale);
    }
  });

  it("maps legacy funding-era lead statuses onto the funnel", () => {
    expect(normalizeLeadStatus("new")).toBe("lead");
    expect(normalizeLeadStatus("contacted")).toBe("business_audit");
    expect(normalizeLeadStatus("qualified")).toBe("qualified_opportunity");
    expect(normalizeLeadStatus("closed")).toBe("closed_won");
    expect(normalizeLeadStatus("funded")).toBe("closed_won");
    expect(normalizeLeadStatus("proposal")).toBe("proposal");
  });

  it("asks qualification questions from the prospect workflow", () => {
    const questions = buildQualificationQuestions(lead, context);
    expect(questions.some((question) => question.includes("Acme HVAC"))).toBe(true);
    expect(questions.some((question) => question.includes("manual lead follow-up"))).toBe(true);
    expect(questions.some((question) => question.includes("spreadsheets"))).toBe(true);
    expect(questions.some((question) => question.includes("workflow automation implementation"))).toBe(
      true,
    );
  });
});
