import { describe, expect, it } from "vitest";
import { mapCallRow } from "@/lib/calls/mappers";

describe("call mappers", () => {
  it("maps call rows to domain types", () => {
    const call = mapCallRow({
      id: "call-1",
      lead_id: "lead-1",
      rep_user_id: "user-1",
      phase: "active",
      started_at: "2026-01-01T00:00:00Z",
      ended_at: null,
    });

    expect(call.leadId).toBe("lead-1");
    expect(call.phase).toBe("active");
    expect(call.endedAt).toBeUndefined();
  });
});
