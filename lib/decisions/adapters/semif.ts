import type { DecisionAdapter, DecideOptions } from "@/lib/decisions/adapter";
import { getSemIfEnv } from "@/lib/decisions/env";
import { assertValidRequest, normalizeDecisionResult } from "@/lib/decisions/normalize";
import { heuristicDecisionAdapter } from "@/lib/decisions/adapters/heuristic";
import type { DecisionRequest, DecisionResult } from "@/lib/decisions/types";

type SemIfResponseBody = {
  scores?: Array<{ id?: string; probability?: number; score?: number; rationale?: string }>;
  selected_option_id?: string;
  selectedOptionId?: string;
  confidence?: number;
  rationale?: string;
  run_id?: string;
  error?: { message?: string };
  message?: string;
};

/**
 * SemIf / OpenJev connector: typed state+question+options → option probabilities.
 * Switched on via AION_DECISION_ADAPTER=semif — product code stays provider-agnostic.
 */
export class SemIfDecisionAdapter implements DecisionAdapter {
  readonly id = "semif" as const;

  async decide(request: DecisionRequest, options?: DecideOptions): Promise<DecisionResult> {
    assertValidRequest(request);

    const configured = getSemIfEnv();
    const url = options?.semifUrl?.trim() ?? (configured.ok ? configured.env.url : undefined);
    const apiKey =
      options?.semifApiKey?.trim() ?? (configured.ok ? configured.env.apiKey : undefined);

    if (!url || !apiKey) {
      const fallback = await heuristicDecisionAdapter.decide(request, options);
      return {
        ...fallback,
        adapterId: this.id,
        rationale:
          `SemIf not configured; used heuristic fallback. ${fallback.rationale ?? ""}`.trim(),
        providerMeta: { ...fallback.providerMeta, fallback: "heuristic", reason: "missing_env" },
      };
    }

    try {
      const fetchFn = options?.fetch ?? fetch;
      const endpoint = buildSemIfDecideUrl(url);
      const response = await fetchFn(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          decision_type: request.decisionType,
          question: request.question,
          options: request.options.map((o) => ({
            id: o.id,
            label: o.label,
            description: o.description ?? null,
          })),
          state: request.state,
          context_summary: request.contextSummary ?? null,
        }),
      });

      const body = (await response.json()) as SemIfResponseBody;
      if (!response.ok) {
        throw new Error(semifErrorMessage(response.status, body));
      }

      const scores: Array<{ id: string; score: number; rationale?: string }> = [];
      for (const row of body.scores ?? []) {
        const score =
          typeof row.probability === "number"
            ? row.probability
            : typeof row.score === "number"
              ? row.score
              : undefined;
        if (typeof row.id !== "string" || typeof score !== "number") {
          continue;
        }
        scores.push({
          id: row.id,
          score,
          ...(typeof row.rationale === "string" ? { rationale: row.rationale } : {}),
        });
      }

      if (!scores.length) {
        throw new Error("SemIf returned no usable option scores.");
      }

      const result = normalizeDecisionResult({
        adapterId: this.id,
        request,
        scores,
        rationale: typeof body.rationale === "string" ? body.rationale : undefined,
        providerMeta: {
          mode: "semif",
          runId: typeof body.run_id === "string" ? body.run_id : undefined,
        },
      });

      const preferred =
        body.selectedOptionId?.trim() || body.selected_option_id?.trim() || undefined;
      if (preferred && request.options.some((o) => o.id === preferred)) {
        return { ...result, selectedOptionId: preferred };
      }

      return result;
    } catch (error) {
      const fallback = await heuristicDecisionAdapter.decide(request, options);
      return {
        ...fallback,
        adapterId: this.id,
        rationale: `SemIf request failed; used heuristic fallback. ${
          error instanceof Error ? error.message : "unknown error"
        }`.trim(),
        providerMeta: { ...fallback.providerMeta, fallback: "heuristic", reason: "request_failed" },
      };
    }
  }
}

function buildSemIfDecideUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  if (base.endsWith("/decide") || base.endsWith("/v1/decide")) {
    return base;
  }
  if (base.endsWith("/v1")) {
    return `${base}/decide`;
  }
  return `${base}/v1/decide`;
}

function semifErrorMessage(status: number, body: SemIfResponseBody): string {
  const detail = body.error?.message ?? body.message;
  if (detail) {
    return `SemIf decision request failed (${status}): ${detail}`;
  }
  return `SemIf decision request failed (${status}).`;
}

export const semifDecisionAdapter = new SemIfDecisionAdapter();
