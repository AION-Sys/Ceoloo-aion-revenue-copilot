import type { DecisionAdapterId } from "@/lib/decisions/types";

const ADAPTER_IDS: readonly DecisionAdapterId[] = ["heuristic", "gateway", "semif"];

export type SemIfEnv = {
  url: string;
  apiKey: string;
};

export function parseDecisionAdapterId(
  value: string | undefined,
): DecisionAdapterId {
  const normalized = value?.trim().toLowerCase();
  if (normalized && (ADAPTER_IDS as readonly string[]).includes(normalized)) {
    return normalized as DecisionAdapterId;
  }
  return "heuristic";
}

/**
 * Active decision connector. Default: heuristic (no network).
 * Switch with AION_DECISION_ADAPTER=heuristic|gateway|semif.
 */
export function getDecisionAdapterId(): DecisionAdapterId {
  return parseDecisionAdapterId(process.env.AION_DECISION_ADAPTER);
}

export function getSemIfEnv():
  | { ok: true; env: SemIfEnv }
  | { ok: false; error: string } {
  const url = process.env.AION_SEMIF_URL?.trim();
  const apiKey = process.env.AION_SEMIF_API_KEY?.trim();

  if (!url || !apiKey) {
    return {
      ok: false,
      error:
        "SemIf decision adapter is not configured. Set AION_SEMIF_URL and AION_SEMIF_API_KEY.",
    };
  }

  return { ok: true, env: { url, apiKey } };
}
