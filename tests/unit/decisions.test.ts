import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertValidRequest,
  decide,
  decideNextBestAction,
  decideObjectionHandling,
  decideQualification,
  getDecisionAdapter,
  getDecisionAdapterId,
  getSemIfEnv,
  listDecisionAdapters,
  normalizeDecisionResult,
  parseDecisionAdapterId,
} from "@/lib/decisions";
import type { DecisionRequest } from "@/lib/decisions/types";
import type { BusinessContext, Lead } from "@/lib/sales/types";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme Ops",
  status: "business_audit",
};

const context: BusinessContext = {
  id: "ctx-1",
  organizationId: "org-1",
  industry: "home services",
  existingSystems: ["Jobber", "QuickBooks"],
  workflowProblems: ["missed follow-ups after estimates"],
  recommendedService: "workflow automation implementation",
};

const baseRequest: DecisionRequest = {
  decisionType: "test.choice",
  question: "Which option fits?",
  options: [
    { id: "a", label: "Option A", description: "follow-ups" },
    { id: "b", label: "Option B", description: "unrelated" },
  ],
  state: { signal: "follow-ups after estimates" },
};

describe("decision adapter env", () => {
  it("defaults to heuristic when unset or unknown", () => {
    delete process.env.AION_DECISION_ADAPTER;
    expect(getDecisionAdapterId()).toBe("heuristic");
    expect(parseDecisionAdapterId("nope")).toBe("heuristic");
  });

  it("parses known adapter ids", () => {
    expect(parseDecisionAdapterId("semif")).toBe("semif");
    expect(parseDecisionAdapterId("GATEWAY")).toBe("gateway");
  });

  it("reports SemIf env gaps", () => {
    delete process.env.AION_SEMIF_URL;
    delete process.env.AION_SEMIF_API_KEY;
    const result = getSemIfEnv();
    expect(result.ok).toBe(false);
  });
});

describe("normalizeDecisionResult", () => {
  it("normalizes scores and picks the winner", () => {
    const result = normalizeDecisionResult({
      adapterId: "heuristic",
      request: baseRequest,
      scores: [
        { id: "a", score: 3 },
        { id: "b", score: 1 },
      ],
    });

    expect(result.selectedOptionId).toBe("a");
    expect(result.options[0]?.score).toBeCloseTo(0.75);
    expect(result.options[1]?.score).toBeCloseTo(0.25);
    expect(result.confidence).toBeCloseTo(0.75);
  });

  it("rejects invalid requests", () => {
    expect(() =>
      assertValidRequest({ ...baseRequest, options: [] }),
    ).toThrow(/at least one option/);
  });
});

describe("heuristic adapter", () => {
  it("scores options from state without network", async () => {
    process.env.AION_DECISION_ADAPTER = "heuristic";
    const adapter = getDecisionAdapter();
    const result = await adapter.decide(baseRequest);

    expect(result.adapterId).toBe("heuristic");
    expect(result.selectedOptionId).toBe("a");
    expect(result.options).toHaveLength(2);
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe("gateway adapter", () => {
  it("parses JSON scores from the AI Gateway", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content: JSON.stringify({
          scores: [
            { id: "a", score: 2, rationale: "matches follow-ups" },
            { id: "b", score: 0.5 },
          ],
          rationale: "A fits the workflow leak.",
        }),
      }),
    });

    process.env.AION_AI_GATEWAY_URL = "https://gateway.example.com";
    process.env.AION_AI_GATEWAY_API_KEY = "test-key";

    const result = await decide(baseRequest, {
      adapterId: "gateway",
      fetch: fetchMock as typeof fetch,
    });

    expect(result.adapterId).toBe("gateway");
    expect(result.selectedOptionId).toBe("a");
    expect(result.rationale).toContain("workflow leak");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("falls back to heuristic when gateway fails", async () => {
    delete process.env.AION_AI_GATEWAY_URL;
    delete process.env.AION_AI_GATEWAY_API_KEY;

    const result = await decide(baseRequest, { adapterId: "gateway" });
    expect(result.adapterId).toBe("gateway");
    expect(result.providerMeta?.fallback).toBe("heuristic");
    expect(result.selectedOptionId).toBeTruthy();
  });
});

describe("semif adapter", () => {
  it("posts typed decide payloads and maps probabilities", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        scores: [
          { id: "a", probability: 0.8 },
          { id: "b", probability: 0.2 },
        ],
        selected_option_id: "a",
        rationale: "SemIf ranked follow-up fit highest.",
        run_id: "run-123",
      }),
    });

    const result = await decide(baseRequest, {
      adapterId: "semif",
      fetch: fetchMock as typeof fetch,
      semifUrl: "https://semif.example.com",
      semifApiKey: "semif-key",
    });

    expect(result.adapterId).toBe("semif");
    expect(result.selectedOptionId).toBe("a");
    expect(result.providerMeta?.runId).toBe("run-123");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://semif.example.com/v1/decide");
    expect(JSON.parse(String(init.body)).decision_type).toBe("test.choice");
  });

  it("falls back when SemIf env is missing", async () => {
    delete process.env.AION_SEMIF_URL;
    delete process.env.AION_SEMIF_API_KEY;

    const result = await decide(baseRequest, { adapterId: "semif" });
    expect(result.adapterId).toBe("semif");
    expect(result.providerMeta?.fallback).toBe("heuristic");
  });
});

describe("sales decision helpers", () => {
  it("scores qualification without inventing options", async () => {
    const result = await decideQualification(
      {
        lead,
        context,
        profile: {
          currentWorkflow: "manual estimate chase",
          businessImpact: "lost revenue",
          decisionMaker: "owner",
          budgetFit: "yes",
          recommendedService: "workflow automation implementation",
        },
        buyingSignals: ["asked for timeline"],
      },
      { adapterId: "heuristic" },
    );

    expect(listDecisionAdapters()).toEqual(["heuristic", "gateway", "semif"]);
    expect(["unqualified", "exploring", "qualified", "disqualified"]).toContain(
      result.qualification,
    );
    expect(result.options.map((o) => o.id)).toEqual([
      "unqualified",
      "exploring",
      "qualified",
      "disqualified",
    ]);
  });

  it("scores next-best action and objection handling", async () => {
    const next = await decideNextBestAction(
      { lead, context, objections: ["too busy"] },
      { adapterId: "heuristic" },
    );
    expect(next.decisionType).toBe("sales.next_best_action");
    expect(next.selectedOptionId).toBeTruthy();

    const objection = await decideObjectionHandling(
      { lead, context, objection: "We're too busy right now" },
      { adapterId: "heuristic" },
    );
    expect(objection.decisionType).toBe("sales.objection_handling");
    expect(objection.options.length).toBe(4);
  });
});
