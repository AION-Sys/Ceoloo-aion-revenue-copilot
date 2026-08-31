import { describe, expect, it } from "vitest";
import { buildDuringCallGuidance } from "@/lib/intelligence/during-call";
import type { BusinessContext, Lead } from "@/lib/sales/types";

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme HVAC",
};

const context: BusinessContext = {
  id: "ctx-1",
  organizationId: "org-1",
  industry: "home-services",
  services: ["HVAC repair"],
  likelyPains: ["slow lead response"],
  relevantOffer: "conversion copilot trial",
};

describe("buildDuringCallGuidance", () => {
  it("includes discovery checklist and next-best question from context", () => {
    const guidance = buildDuringCallGuidance({ lead, context });

    expect(guidance.checklist.length).toBeGreaterThan(2);
    expect(guidance.nextBestQuestion).toContain("slow lead response");
    expect(guidance.nextBestAction).toContain("conversion copilot trial");
  });

  it("uses rep notes in the script cue when provided", () => {
    const guidance = buildDuringCallGuidance({
      lead,
      context,
      repNotes: "They lose leads after hours",
    });

    expect(guidance.scriptCue).toContain("They lose leads after hours");
  });

  it("returns an objection reframe when an objection is supplied", () => {
    const guidance = buildDuringCallGuidance({
      lead,
      context,
      objection: "too expensive right now",
    });

    expect(guidance.objectionReframe).toContain("cost");
  });
});
