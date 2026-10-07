import { afterEach, describe, expect, it } from "vitest";
import {
  buildDuringCallGuidance,
  generateDuringCallGuidance,
} from "@/lib/intelligence/during-call";
import { buildAgentSystemPrompt } from "@/lib/sales/motion";
import type { BusinessContext, Lead } from "@/lib/sales/types";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

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
  workflowProblems: ["slow lead response"],
  recommendedService: "workflow automation implementation",
};

describe("buildDuringCallGuidance", () => {
  it("includes discovery checklist and next-best question from context", () => {
    const guidance = buildDuringCallGuidance({ lead, context });

    expect(guidance.checklist.length).toBeGreaterThan(2);
    expect(guidance.checklist.some((item) => item.toLowerCase().includes("decision maker"))).toBe(
      true,
    );
    expect(guidance.checklist.some((item) => item.toLowerCase().includes("automation"))).toBe(true);
    expect(guidance.nextBestQuestion).toContain("slow lead response");
    expect(guidance.nextBestAction).toContain("workflow automation implementation");
    expect(guidance.qualificationPrompt.toLowerCase()).not.toContain("capital");
    expect(buildAgentSystemPrompt().toLowerCase()).not.toContain("annual revenue");
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

describe("generateDuringCallGuidance + decision adapter", () => {
  it("attaches switchable discrete decision scores", async () => {
    process.env.AION_DECISION_ADAPTER = "heuristic";
    delete process.env.AION_AI_GATEWAY_URL;
    delete process.env.AION_AI_GATEWAY_API_KEY;

    const guidance = await generateDuringCallGuidance({
      lead,
      context,
      objection: "We're too busy to change workflows",
    });

    expect(guidance.decisionAdapterId).toBe("heuristic");
    expect(guidance.nextBestActionDecision?.decisionType).toBe("sales.next_best_action");
    expect(guidance.objectionDecision?.decisionType).toBe("sales.objection_handling");
    expect(guidance.objectionReframe).toMatch(/Strategy \(heuristic\)/);
    expect(guidance.nextBestAction.length).toBeGreaterThan(0);
  });
});
