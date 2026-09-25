import { describe, expect, it } from "vitest";
import {
  buildCrmEventPayload,
  outcomeToCrmEvent,
  qualificationToLeadStatus,
} from "@/lib/crm/persistence";
import { outcomeToLearningEvent, ingestLearningEvent } from "@/lib/learning/events";
import type { CallOutcome } from "@/lib/sales/types";

const outcome: CallOutcome = {
  id: "outcome-1",
  leadId: "lead-1",
  painPoints: ["slow response"],
  objections: [{ objection: "too expensive", resolved: false }],
  qualification: "exploring",
  nextAction: "send proposal",
  occurredAt: new Date().toISOString(),
};

describe("post-call CRM mapping (Task 7)", () => {
  it("maps call outcome to CRM event and lead status", () => {
    const event = outcomeToCrmEvent(outcome);
    expect(event.eventType).toBe("call_completed");
    expect(event.leadId).toBe("lead-1");
    expect(qualificationToLeadStatus(outcome.qualification)).toBe("contacted");
  });

  it("emits CRM payload contract v1 fields", () => {
    const payload = buildCrmEventPayload(outcome);
    expect(payload.schema_version).toBe("1");
    expect(payload.event_type).toBe("call_completed");
    expect(payload.outcome_id).toBe("outcome-1");
  });
});

describe("learning events", () => {
  it("maps call outcome to learning event", () => {
    const event = outcomeToLearningEvent(outcome);
    expect(event.eventType).toBe("call_outcome");
    expect(event.payload.leadId).toBe("lead-1");
  });

  it("accepts valid learning events", async () => {
    const event = outcomeToLearningEvent(outcome);
    const result = await ingestLearningEvent(event);
    expect(result.accepted).toBe(true);
  });
});
