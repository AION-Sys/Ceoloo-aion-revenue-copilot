import type {
  LearningMemoryAdapterId,
  RecallMemoryInput,
  RecallMemoryResult,
  ReflectMemoryInput,
  ReflectMemoryResult,
  RetainMemoryInput,
  RetainMemoryResult,
} from "@/lib/learning/memory/types";

export type LearningMemoryOptions = {
  fetch?: typeof fetch;
  adapterId?: LearningMemoryAdapterId;
  hindsightUrl?: string;
  hindsightApiKey?: string;
  /** Override default bank when helpers omit bankId. */
  bankId?: string;
};

/**
 * Switchable self-learning memory connector.
 * Mirrors Hindsight retain / recall / reflect without binding product code to it.
 */
export interface LearningMemoryAdapter {
  readonly id: LearningMemoryAdapterId;
  retain(input: RetainMemoryInput, options?: LearningMemoryOptions): Promise<RetainMemoryResult>;
  recall(input: RecallMemoryInput, options?: LearningMemoryOptions): Promise<RecallMemoryResult>;
  reflect(
    input: ReflectMemoryInput,
    options?: LearningMemoryOptions,
  ): Promise<ReflectMemoryResult>;
}
