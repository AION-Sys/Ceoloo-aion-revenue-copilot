/**
 * Provider-agnostic decision contract.
 *
 * Discrete choices only: state + question + options → scored options.
 * Generative chat stays on the AI Gateway path; this layer never parses free text
 * into structured CRM/qualification fields.
 */

export type DecisionAdapterId = "heuristic" | "gateway" | "semif";

export type DecisionOption = {
  id: string;
  label: string;
  description?: string;
};

export type DecisionState = Record<string, unknown>;

export type DecisionRequest = {
  /** Stable decision type for adapters and learning lineage. */
  decisionType: string;
  question: string;
  options: DecisionOption[];
  state: DecisionState;
  /** Optional hint — adapters may ignore. */
  contextSummary?: string;
};

export type ScoredOption = {
  id: string;
  label: string;
  score: number;
  rationale?: string;
};

export type DecisionResult = {
  adapterId: DecisionAdapterId;
  decisionType: string;
  question: string;
  /** Scores are probabilities or relative weights in [0, 1], summing ≈ 1 when possible. */
  options: ScoredOption[];
  selectedOptionId: string;
  confidence: number;
  rationale?: string;
  /** Opaque provider metadata (model id, run id) — never secrets. */
  providerMeta?: Record<string, unknown>;
};
