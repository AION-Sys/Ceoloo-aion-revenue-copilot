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

  it("rejects non-object bodies", () => {
    expect(parsePostCallOutcomeInput(null)).toBeNull();
    expect(parsePostCallOutcomeInput("invalid")).toBeNull();
  });
});
