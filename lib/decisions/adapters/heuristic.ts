import type { DecisionAdapter, DecideOptions } from "@/lib/decisions/adapter";
import { assertValidRequest, normalizeDecisionResult } from "@/lib/decisions/normalize";
import type { DecisionRequest, DecisionResult } from "@/lib/decisions/types";

/**
 * Deterministic, offline scorer. Uses keyword / state heuristics so local
 * and CI paths never depend on a model provider.
 */
export class HeuristicDecisionAdapter implements DecisionAdapter {
  readonly id = "heuristic" as const;

  async decide(request: DecisionRequest, options?: DecideOptions): Promise<DecisionResult> {
    void options;
    assertValidRequest(request);
    const scores = scoreHeuristically(request);
    return normalizeDecisionResult({
      adapterId: this.id,
      request,
      scores,
      rationale: "Heuristic adapter — offline, provider-agnostic fallback.",
      providerMeta: { mode: "deterministic" },
    });
  }
}

function scoreHeuristically(
  request: DecisionRequest,
): Array<{ id: string; score: number; rationale?: string }> {
  const blob = JSON.stringify({
    state: request.state,
    summary: request.contextSummary ?? "",
    question: request.question,
  }).toLowerCase();

  return request.options.map((option) => {
    const tokens = tokenize(`${option.id} ${option.label} ${option.description ?? ""}`);
    let hits = 0;
    for (const token of tokens) {
      if (token.length < 3) continue;
      if (blob.includes(token)) hits += 1;
    }

    // Slight preference for options whose ids appear literally in state keys/values.
    const idBoost = blob.includes(option.id.toLowerCase()) ? 1.5 : 0;
    const score = 0.35 + hits + idBoost;

    return {
      id: option.id,
      score,
      rationale:
        hits > 0
          ? `Matched ${hits} signal(s) in decision state.`
          : "No strong state match; relative weight only.",
    };
  });
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter(Boolean);
}

export const heuristicDecisionAdapter = new HeuristicDecisionAdapter();
