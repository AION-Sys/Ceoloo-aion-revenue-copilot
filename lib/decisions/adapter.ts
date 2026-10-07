import type { DecisionRequest, DecisionResult } from "@/lib/decisions/types";
import type { DecisionAdapterId } from "@/lib/decisions/types";

export type DecideOptions = {
  fetch?: typeof fetch;
  /** Test/override injection — skips env resolution when set. */
  adapterId?: DecisionAdapterId;
  /** SemIf connector overrides (ignored by other adapters). */
  semifUrl?: string;
  semifApiKey?: string;
};

/**
 * Switchable decision connector. Implementations must not invent options;
 * they only score the options supplied in the request.
 */
export interface DecisionAdapter {
  readonly id: DecisionAdapterId;
  decide(request: DecisionRequest, options?: DecideOptions): Promise<DecisionResult>;
}
