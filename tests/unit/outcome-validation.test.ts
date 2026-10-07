import { describe, expect, it } from "vitest";
import { parsePostCallOutcomeInput } from "@/lib/outcomes/validation";

describe("post-call outcome validation", () => {
  it("accepts a valid outcome payload", () => {
    const input = parsePostCallOutcomeInput({
      qualification: "qualified",
      painPoints: [" slow response ", ""],
      objections: [
        { objection: "too expensive", resolved: true, suggestedReframe: " ROI framing " },
        { objection: "  ", resolved: false },
      ],
      nextAction: " send proposal ",
      transcriptSummary: " Strong discovery call ",
    });

    expect(input).toEqual({
      qualification: "qualified",
      painPoints: ["slow response"],
      objections: [
        { objection: "too expensive", resolved: true, suggestedReframe: "ROI framing" },
      ],
      nextAction: "send proposal",
      transcriptSummary: "Strong discovery call",
    });
  });

  it("rejects missing qualification", () => {
    expect(
      parsePostCallOutcomeInput({
        qualification: "maybe",
        nextAction: "follow up",
      }),
    ).toBeNull();
  });

  it("rejects missing next action", () => {
    expect(
      parsePostCallOutcomeInput({
        qualification: "exploring",
        nextAction: "   ",
      }),
    ).toBeNull();
  });

  it("keeps AION qualification dimensions and drops funding fields", () => {
    const input = parsePostCallOutcomeInput({
      qualification: "exploring",
      nextAction: "schedule business audit",
      qualificationProfile: {
        currentWorkflow: " Jobs are tracked in a spreadsheet ",
        capitalNeed: "$50k",
        annualRevenue: "2m",
        fundingUrgency: "this week",
      },
    });

    expect(input?.qualificationProfile).toEqual({
      currentWorkflow: "Jobs are tracked in a spreadsheet",
    });
  });

  it("parses economicImpact and computes monthly exposure", () => {
    const input = parsePostCallOutcomeInput({
      qualification: "qualified",
      nextAction: "Revenue Systems Assessment",
      qualificationProfile: {
        currentWorkflow: "Phone chase",
        economicImpact: {
          leadsPerMonth: 40,
          delayedShare: 0.25,
          avgJobValue: 4000,
          closeRate: 0.3,
          source: "prospect_stated",
        },
      },
    });

    expect(input?.qualificationProfile?.economicImpact?.monthlyRevenueExposure).toBe(12000);
    expect(input?.qualificationProfile?.economicImpact?.source).toBe("prospect_stated");
  });

  it("rejects non-object bodies", () => {
    expect(parsePostCallOutcomeInput(null)).toBeNull();
    expect(parsePostCallOutcomeInput("invalid")).toBeNull();
  });
});
