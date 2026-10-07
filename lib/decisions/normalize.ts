import type {
  DecisionAdapterId,
  DecisionOption,
  DecisionRequest,
  DecisionResult,
  ScoredOption,
} from "@/lib/decisions/types";

/**
 * Normalize raw scores onto [0,1] summing to 1, pick the winner.
 * Missing options get score 0. Unknown option ids are dropped.
 */
export function normalizeDecisionResult(input: {
  adapterId: DecisionAdapterId;
  request: DecisionRequest;
  scores: Array<{ id: string; score: number; rationale?: string }>;
  rationale?: string;
  providerMeta?: Record<string, unknown>;
}): DecisionResult {
  const byId = new Map(input.scores.map((s) => [s.id, s]));
  const raw = input.request.options.map((option) => {
    const hit = byId.get(option.id);
    const score = hit && Number.isFinite(hit.score) ? Math.max(0, hit.score) : 0;
    return {
      id: option.id,
      label: option.label,
      score,
      rationale: hit?.rationale,
    } satisfies ScoredOption;
  });

  const sum = raw.reduce((acc, o) => acc + o.score, 0);
  const options =
    sum > 0
      ? raw.map((o) => ({ ...o, score: o.score / sum }))
      : uniformScores(input.request.options);

  const selected = options.reduce((best, o) => (o.score > best.score ? o : best), options[0]!);
  const confidence = selected.score;

  return {
    adapterId: input.adapterId,
    decisionType: input.request.decisionType,
    question: input.request.question,
    options,
    selectedOptionId: selected.id,
    confidence,
    rationale: input.rationale ?? selected.rationale,
    providerMeta: input.providerMeta,
  };
}

function uniformScores(options: DecisionOption[]): ScoredOption[] {
  const score = options.length > 0 ? 1 / options.length : 0;
  return options.map((o) => ({ id: o.id, label: o.label, score }));
}

export function assertValidRequest(request: DecisionRequest): void {
  if (!request.decisionType.trim()) {
    throw new Error("Decision request requires decisionType.");
  }
  if (!request.question.trim()) {
    throw new Error("Decision request requires question.");
  }
  if (!request.options.length) {
    throw new Error("Decision request requires at least one option.");
  }
  const ids = new Set<string>();
  for (const option of request.options) {
    if (!option.id.trim()) {
      throw new Error("Decision option requires id.");
    }
    if (ids.has(option.id)) {
      throw new Error(`Duplicate decision option id: ${option.id}`);
    }
    ids.add(option.id);
  }
}
