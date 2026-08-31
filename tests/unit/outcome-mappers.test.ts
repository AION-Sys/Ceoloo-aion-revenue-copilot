import { describe, expect, it } from "vitest";
import { mapCallOutcomeRow } from "@/lib/outcomes/mappers";

describe("outcome mappers", () => {
  it("maps call outcome rows to domain types", () => {
    const outcome = mapCallOutcomeRow(
      {
        id: "outcome-1",
        call_id: "call-1",
        qualification: "qualified",
        pain_points: ["slow response", "missed callbacks"],
        objections: [{ objection: "too expensive", resolved: false }],
        next_action: "send proposal",
        transcript_summary: "Strong fit for HVAC bundle.",
        created_at: "2026-01-01T00:00:00Z",
      },
      "lead-1",
    );

    expect(outcome.leadId).toBe("lead-1");
    expect(outcome.painPoints).toEqual(["slow response", "missed callbacks"]);
    expect(outcome.transcriptSummary).toBe("Strong fit for HVAC bundle.");
    expect(outcome.nextAction).toBe("send proposal");
  });

  it("omits transcript summary when null", () => {
    const outcome = mapCallOutcomeRow(
      {
        id: "outcome-2",
        call_id: "call-2",
        qualification: "exploring",
        pain_points: [],
        objections: [],
        next_action: "follow up next week",
        transcript_summary: null,
        created_at: "2026-01-01T00:00:00Z",
      },
      "lead-2",
    );

    expect(outcome.transcriptSummary).toBeUndefined();
  });
});
