import type { DecisionAdapter, DecideOptions } from "@/lib/decisions/adapter";
import { complete } from "@/lib/ai/gateway";
import { assertValidRequest, normalizeDecisionResult } from "@/lib/decisions/normalize";
import { heuristicDecisionAdapter } from "@/lib/decisions/adapters/heuristic";
import type { DecisionRequest, DecisionResult } from "@/lib/decisions/types";

type GatewayScorePayload = {
  scores?: Array<{ id?: string; score?: number; rationale?: string }>;
  rationale?: string;
};

/**
 * Scores options via AION AI Gateway. Model is still gateway-routed —
 * the product never binds to a vendor SDK. Falls back to heuristic on failure.
 */
export class GatewayDecisionAdapter implements DecisionAdapter {
  readonly id = "gateway" as const;

  async decide(request: DecisionRequest, options?: DecideOptions): Promise<DecisionResult> {
    assertValidRequest(request);

    try {
      const { content } = await complete(
        {
          messages: [
            {
              role: "system",
              content: [
                "You are a discrete decision scorer for AION Revenue Copilot.",
                "Return ONLY valid JSON matching:",
                '{"scores":[{"id":"<option id>","score":<number>,"rationale":"<short>"}],"rationale":"<short>"}',
                "Score every provided option. Higher score = better fit. Do not invent option ids.",
              ].join(" "),
            },
            {
              role: "user",
              content: JSON.stringify({
                decisionType: request.decisionType,
                question: request.question,
                options: request.options,
                state: request.state,
                contextSummary: request.contextSummary ?? null,
              }),
            },
          ],
        },
        options?.fetch ? { fetch: options.fetch } : undefined,
      );

      const parsed = parseGatewayScores(content);
      return normalizeDecisionResult({
        adapterId: this.id,
        request,
        scores: parsed.scores,
        rationale: parsed.rationale,
        providerMeta: { mode: "gateway_json" },
      });
    } catch {
      const fallback = await heuristicDecisionAdapter.decide(request, options);
      return {
        ...fallback,
        adapterId: this.id,
        rationale: `Gateway unavailable; used heuristic fallback. ${fallback.rationale ?? ""}`.trim(),
        providerMeta: { ...fallback.providerMeta, fallback: "heuristic" },
      };
    }
  }
}

function parseGatewayScores(content: string): {
  scores: Array<{ id: string; score: number; rationale?: string }>;
  rationale?: string;
} {
  const jsonText = extractJsonObject(content);
  const body = JSON.parse(jsonText) as GatewayScorePayload;
  const scores = (body.scores ?? [])
    .filter((row): row is { id: string; score: number; rationale?: string } => {
      return typeof row.id === "string" && typeof row.score === "number";
    })
    .map((row) => ({
      id: row.id,
      score: row.score,
      rationale: typeof row.rationale === "string" ? row.rationale : undefined,
    }));

  if (!scores.length) {
    throw new Error("Gateway decision response contained no usable scores.");
  }

  return {
    scores,
    rationale: typeof body.rationale === "string" ? body.rationale : undefined,
  };
}

function extractJsonObject(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  throw new Error("Gateway decision response was not JSON.");
}

export const gatewayDecisionAdapter = new GatewayDecisionAdapter();
