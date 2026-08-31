import { describe, expect, it } from "vitest";
import { resolvePreCallBriefAccess } from "@/lib/intelligence/brief";
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
  industry: "home-services",
  services: ["HVAC repair"],
  likelyPains: ["slow lead response"],
  relevantOffer: "conversion copilot trial",
};

describe("pre-call brief service", () => {
  it("builds a brief for an in-org lead", () => {
    const brief = buildPreCallBrief(lead, context);
    expect(brief.lead.companyName).toBe("Acme HVAC");
    expect(brief.recommendedQuestions.length).toBeGreaterThan(0);
  });

  it("returns not_found when lead is missing", () => {
    expect(resolvePreCallBriefAccess(null, "org-1")).toBe("not_found");
  });

  it("returns forbidden for cross-organization access", () => {
    expect(resolvePreCallBriefAccess(lead, "org-2")).toBe("forbidden");
  });

  it("returns ok when lead belongs to the rep organization", () => {
    expect(resolvePreCallBriefAccess(lead, "org-1")).toBe("ok");
  });
});
