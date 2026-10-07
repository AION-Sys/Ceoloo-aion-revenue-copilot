import type { DecisionAdapter, DecideOptions } from "@/lib/decisions/adapter";
import { gatewayDecisionAdapter } from "@/lib/decisions/adapters/gateway";
import { heuristicDecisionAdapter } from "@/lib/decisions/adapters/heuristic";
import { semifDecisionAdapter } from "@/lib/decisions/adapters/semif";
import { getDecisionAdapterId } from "@/lib/decisions/env";
import type { DecisionAdapterId, DecisionRequest, DecisionResult } from "@/lib/decisions/types";

const ADAPTERS: Record<DecisionAdapterId, DecisionAdapter> = {
  heuristic: heuristicDecisionAdapter,
  gateway: gatewayDecisionAdapter,
  semif: semifDecisionAdapter,
};

/**
 * Resolve the active decision connector.
 * Models/tools stay swappable — product code calls `decide()`, never a vendor SDK.
 */
export function getDecisionAdapter(adapterId?: DecisionAdapterId): DecisionAdapter {
  const id = adapterId ?? getDecisionAdapterId();
  return ADAPTERS[id];
}

export function listDecisionAdapters(): DecisionAdapterId[] {
  return Object.keys(ADAPTERS) as DecisionAdapterId[];
}

export async function decide(
  request: DecisionRequest,
  options?: DecideOptions,
): Promise<DecisionResult> {
  const adapter = getDecisionAdapter(options?.adapterId);
  return adapter.decide(request, options);
}
