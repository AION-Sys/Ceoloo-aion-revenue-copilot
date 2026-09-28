import { describe, expect, it } from "vitest";
import { buildPreCallBrief } from "@/lib/intelligence/pre-call";
import type { BusinessContext, Lead } from "@/lib/sales/types";

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme HVAC",
  businessContextId: "ctx-1",
};

const context: BusinessContext = {
  id: "ctx-1",
  organizationId: "org-1",
  industry: "home services",
  existingSystems: ["spreadsheets"],
  workflowProblems: ["slow lead response", "inconsistent follow-up"],
  recommendedService: "workflow automation implementation",
};

describe("buildPreCallBrief", () => {
  it("includes company name and pains in recommended questions", () => {
    const brief = buildPreCallBrief(lead, context);
    expect(brief.recommendedQuestions.some((q) => q.includes("Acme HVAC"))).toBe(true);
    expect(brief.recommendedQuestions.some((q) => q.includes("slow lead response"))).toBe(true);
  });
});
