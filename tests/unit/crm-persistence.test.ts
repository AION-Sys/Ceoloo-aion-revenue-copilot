import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CallOutcome } from "@/lib/sales/types";

const outcome: CallOutcome = {
  id: "outcome-1",
  leadId: "lead-1",
  painPoints: ["slow response"],
  objections: [{ objection: "too expensive", resolved: false }],
  qualification: "exploring",
  nextAction: "send proposal",
  occurredAt: "2026-09-25T12:00:00.000Z",
};

const getSupabasePublicEnv = vi.fn();
const createSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase/env", () => ({
  getSupabasePublicEnv: (...args: unknown[]) => getSupabasePublicEnv(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClient(...args),
}));

type MockTables = {
  leads: {
    update: ReturnType<typeof vi.fn>;
  };
  event_log: {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
  };
};

function createMockSupabase(options?: {
  leadError?: { message: string } | null;
  existingEvents?: Array<{ id: string; payload: Record<string, unknown> }>;
  existingError?: { message: string } | null;
  insertId?: string;
  insertError?: { message: string } | null;
}) {
  const tables: MockTables = {
    leads: {
      update: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: options?.leadError ?? null })),
      })),
    },
    event_log: {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(async () => ({
            data: options?.existingEvents ?? [],
            error: options?.existingError ?? null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: options?.insertError ? null : { id: options?.insertId ?? "event-1" },
            error: options?.insertError ?? null,
          })),
        })),
      })),
    },
  };

  return {
    from: vi.fn((table: keyof MockTables) => tables[table]),
    tables,
  };
}

describe("CRM event mapping", () => {
  it("maps call outcome to CRM event", async () => {
    const { outcomeToCrmEvent } = await import("@/lib/crm/persistence");
    const event = outcomeToCrmEvent(outcome);
    expect(event.eventType).toBe("call_completed");
    expect(event.leadId).toBe("lead-1");
    expect(event.payload.outcomeId).toBe("outcome-1");
  });

  it("builds DATA_MODEL CRM payload contract v1", async () => {
    const { buildCrmEventPayload } = await import("@/lib/crm/persistence");
    expect(buildCrmEventPayload(outcome)).toEqual({
      schema_version: "1",
      event_type: "call_completed",
      lead_id: "lead-1",
      qualification: "exploring",
      next_action: "send proposal",
      outcome_id: "outcome-1",
      occurred_at: "2026-09-25T12:00:00.000Z",
    });
  });

  it("maps qualification to lead status", async () => {
    const { qualificationToLeadStatus } = await import("@/lib/crm/persistence");
    expect(qualificationToLeadStatus("unqualified")).toBe("contacted");
    expect(qualificationToLeadStatus("exploring")).toBe("contacted");
    expect(qualificationToLeadStatus("qualified")).toBe("qualified");
    expect(qualificationToLeadStatus("disqualified")).toBe("closed");
  });
});

describe("persistCallOutcome", () => {
  beforeEach(() => {
    vi.resetModules();
    getSupabasePublicEnv.mockReset();
    createSupabaseServerClient.mockReset();
  });

  it("returns ok:false when outcome ids are missing", async () => {
    const { persistCallOutcome } = await import("@/lib/crm/persistence");
    const result = await persistCallOutcome(
      { ...outcome, id: "", leadId: "" },
      { callId: "call-1" },
    );
    expect(result).toEqual({ ok: false });
  });

  it("returns ok:false when Supabase env is not configured", async () => {
    getSupabasePublicEnv.mockReturnValue({ ok: false, error: "missing" });
    const { persistCallOutcome } = await import("@/lib/crm/persistence");
    const result = await persistCallOutcome(outcome, { callId: "call-1" });
    expect(result).toEqual({ ok: false });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("updates lead status and inserts CRM event_log row", async () => {
    getSupabasePublicEnv.mockReturnValue({
      ok: true,
      env: { url: "https://example.supabase.co", anonKey: "anon" },
    });
    const mock = createMockSupabase({ insertId: "crm-event-1" });
    createSupabaseServerClient.mockResolvedValue(mock);

    const { persistCallOutcome } = await import("@/lib/crm/persistence");
    const result = await persistCallOutcome(outcome, { callId: "call-1" });

    expect(result).toEqual({ ok: true, recordId: "crm-event-1" });
    expect(mock.tables.leads.update).toHaveBeenCalledWith({ status: "contacted" });
    expect(mock.tables.event_log.insert).toHaveBeenCalledWith({
      call_id: "call-1",
      lead_id: "lead-1",
      event_type: "crm",
      payload: {
        schema_version: "1",
        event_type: "call_completed",
        lead_id: "lead-1",
        qualification: "exploring",
        next_action: "send proposal",
        outcome_id: "outcome-1",
        occurred_at: "2026-09-25T12:00:00.000Z",
      },
      external_id: null,
    });
  });

  it("is idempotent when a CRM event for the outcome already exists", async () => {
    getSupabasePublicEnv.mockReturnValue({
      ok: true,
      env: { url: "https://example.supabase.co", anonKey: "anon" },
    });
    const mock = createMockSupabase({
      existingEvents: [
        {
          id: "crm-existing",
          payload: { outcome_id: "outcome-1", event_type: "call_completed" },
        },
      ],
    });
    createSupabaseServerClient.mockResolvedValue(mock);

    const { persistCallOutcome } = await import("@/lib/crm/persistence");
    const result = await persistCallOutcome(outcome, { callId: "call-1" });

    expect(result).toEqual({ ok: true, recordId: "crm-existing" });
    expect(mock.tables.event_log.insert).not.toHaveBeenCalled();
  });

  it("returns ok:false when lead update fails", async () => {
    getSupabasePublicEnv.mockReturnValue({
      ok: true,
      env: { url: "https://example.supabase.co", anonKey: "anon" },
    });
    const mock = createMockSupabase({ leadError: { message: "rls" } });
    createSupabaseServerClient.mockResolvedValue(mock);

    const { persistCallOutcome } = await import("@/lib/crm/persistence");
    const result = await persistCallOutcome(outcome, { callId: "call-1" });
    expect(result).toEqual({ ok: false });
    expect(mock.tables.event_log.insert).not.toHaveBeenCalled();
  });
});
