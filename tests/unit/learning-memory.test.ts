import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAllLocalBanks,
  episodeFromCallOutcome,
  episodeFromMistake,
  episodeFromPractice,
  episodeFromTestRun,
  getLearningMemoryAdapterId,
  getHindsightEnv,
  listLocalEpisodes,
  organizationLearningBankId,
  parseLearningMemoryAdapterId,
  recallGuidanceLessons,
  recallMemory,
  reflectSalesLearning,
  retainCallOutcomeLearning,
  retainMemory,
  retainMistakeLearning,
  retainPracticeLearning,
  retainTestRunLearning,
} from "@/lib/learning/memory";
import { ingestLearningEvent, outcomeToLearningEvent } from "@/lib/learning/events";
import type { CallOutcome, Lead } from "@/lib/sales/types";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  clearAllLocalBanks();
  vi.restoreAllMocks();
});

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-learn",
  companyName: "Acme Ops",
  status: "business_audit",
};

const outcome: CallOutcome = {
  id: "out-1",
  leadId: "lead-1",
  painPoints: ["missed follow-ups"],
  objections: [{ objection: "too busy", resolved: false }],
  qualification: "qualified",
  nextAction: "send audit agenda",
  occurredAt: "2026-10-07T12:00:00.000Z",
};

describe("learning memory env", () => {
  it("defaults to local adapter", () => {
    delete process.env.AION_LEARNING_MEMORY_ADAPTER;
    expect(getLearningMemoryAdapterId()).toBe("local");
    expect(parseLearningMemoryAdapterId("hindsight")).toBe("hindsight");
    expect(organizationLearningBankId("Org 1!")).toBe("org-Org-1-");
  });

  it("requires Hindsight URL when probing env", () => {
    delete process.env.AION_HINDSIGHT_URL;
    expect(getHindsightEnv().ok).toBe(false);
  });
});

describe("local retain / recall / reflect", () => {
  it("retains practices and mistakes, then recalls them", async () => {
    const bankId = "bank-local-1";
    await retainPracticeLearning(
      {
        title: "Confirm impact first",
        detail: "Size the weekly follow-up leak before naming services.",
        seed: "practice-1",
        occurredAt: "2026-10-01T00:00:00.000Z",
      },
      { bankId, adapterId: "local" },
    );
    await retainMistakeLearning(
      {
        title: "Early pitch",
        detail: "Pitching automation before impact stalled the call.",
        seed: "mistake-1",
        occurredAt: "2026-10-02T00:00:00.000Z",
      },
      { bankId, adapterId: "local" },
    );

    expect(listLocalEpisodes(bankId)).toHaveLength(2);

    const recalled = await recallMemory(
      { bankId, query: "follow-up leak impact", kinds: ["practice", "mistake"] },
      { adapterId: "local" },
    );
    expect(recalled.hits.length).toBeGreaterThan(0);
    expect(recalled.hits[0]?.text.toLowerCase()).toContain("follow-up");

    const reflection = await reflectSalesLearning(
      { question: "What should we repeat?", organizationId: "org-learn" },
      { adapterId: "local", bankId },
    );
    expect(reflection.text).toMatch(/retained episode/i);
  });

  it("retains call outcomes and test runs into the loop", async () => {
    const bankId = organizationLearningBankId(lead.organizationId);
    await retainCallOutcomeLearning({ lead, outcome }, { adapterId: "local", bankId });
    await retainTestRunLearning(
      {
        suite: "unit/learning-memory",
        passed: true,
        summary: "Adapter unit tests green.",
        occurredAt: "2026-10-07T13:00:00.000Z",
      },
      { adapterId: "local", bankId },
    );

    const lessons = await recallGuidanceLessons(
      {
        companyName: lead.companyName,
        objection: "too busy",
        workflowProblem: "missed follow-ups",
        organizationId: lead.organizationId,
      },
      { adapterId: "local", bankId },
    );
    expect(lessons.hits.length).toBeGreaterThan(0);
  });
});

describe("episode builders", () => {
  it("maps outcomes, practices, mistakes, and tests", () => {
    expect(episodeFromCallOutcome({ lead, outcome }).valence).toBe("positive");
    expect(episodeFromPractice({ title: "t", detail: "d" }).kind).toBe("practice");
    expect(episodeFromMistake({ title: "t", detail: "d" }).valence).toBe("negative");
    expect(episodeFromTestRun({ suite: "s", passed: false, summary: "x" }).kind).toBe("mistake");
  });
});

describe("hindsight adapter", () => {
  it("posts retain payloads to Hindsight HTTP API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ operation_id: "op-1", document_ids: ["doc-1"] }),
    });

    const episode = episodeFromPractice({
      title: "Audit first",
      detail: "Offer a bounded business audit.",
      seed: "hs-practice",
      occurredAt: "2026-10-07T10:00:00.000Z",
    });

    const result = await retainMemory(
      { bankId: "aion-revenue-copilot", episode },
      {
        adapterId: "hindsight",
        hindsightUrl: "https://hindsight.example.com",
        hindsightApiKey: "hs-key",
        fetch: fetchMock as typeof fetch,
      },
    );

    expect(result.accepted).toBe(true);
    expect(result.adapterId).toBe("hindsight");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hindsight.example.com/v1/default/banks/aion-revenue-copilot/memories");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer hs-key",
    });
    const body = JSON.parse(String(init.body)) as {
      items: Array<{ tags: string[]; metadata: Record<string, unknown> }>;
    };
    expect(body.items[0]?.tags).toContain("kind:practice");
    expect(body.items[0]?.metadata.aion_kind).toBe("practice");
  });

  it("falls back to local when Hindsight URL is missing", async () => {
    delete process.env.AION_HINDSIGHT_URL;
    const episode = episodeFromMistake({
      title: "Skipped discovery",
      detail: "Jumped to proposal too early.",
      seed: "fallback-1",
    });
    const result = await retainMemory(
      { bankId: "fallback-bank", episode },
      { adapterId: "hindsight" },
    );
    expect(result.accepted).toBe(true);
    expect(result.rationale).toMatch(/unavailable/i);
    expect(listLocalEpisodes("fallback-bank")).toHaveLength(1);
  });
});

describe("ingestLearningEvent retains memory", () => {
  it("accepts events and retains into local memory", async () => {
    process.env.AION_LEARNING_MEMORY_ADAPTER = "local";
    const event = outcomeToLearningEvent(outcome);
    const result = await ingestLearningEvent(event, {
      adapterId: "local",
      organizationId: lead.organizationId,
    });
    expect(result.accepted).toBe(true);
    expect(result.memoryAdapterId).toBe("local");
    expect(result.memoryEpisodeId).toBeTruthy();
  });
});
