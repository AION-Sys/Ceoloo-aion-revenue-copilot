import type { LearningMemoryAdapter, LearningMemoryOptions } from "@/lib/learning/memory/adapter";
import { hindsightLearningMemoryAdapter } from "@/lib/learning/memory/adapters/hindsight";
import { localLearningMemoryAdapter } from "@/lib/learning/memory/adapters/local";
import { getLearningMemoryAdapterId } from "@/lib/learning/memory/env";
import type {
  LearningMemoryAdapterId,
  RecallMemoryInput,
  RecallMemoryResult,
  ReflectMemoryInput,
  ReflectMemoryResult,
  RetainMemoryInput,
  RetainMemoryResult,
} from "@/lib/learning/memory/types";

const ADAPTERS: Record<LearningMemoryAdapterId, LearningMemoryAdapter> = {
  local: localLearningMemoryAdapter,
  hindsight: hindsightLearningMemoryAdapter,
};

export function getLearningMemoryAdapter(
  adapterId?: LearningMemoryAdapterId,
): LearningMemoryAdapter {
  return ADAPTERS[adapterId ?? getLearningMemoryAdapterId()];
}

export function listLearningMemoryAdapters(): LearningMemoryAdapterId[] {
  return Object.keys(ADAPTERS) as LearningMemoryAdapterId[];
}

export async function retainMemory(
  input: RetainMemoryInput,
  options?: LearningMemoryOptions,
): Promise<RetainMemoryResult> {
  return getLearningMemoryAdapter(options?.adapterId).retain(input, options);
}

export async function recallMemory(
  input: RecallMemoryInput,
  options?: LearningMemoryOptions,
): Promise<RecallMemoryResult> {
  return getLearningMemoryAdapter(options?.adapterId).recall(input, options);
}

export async function reflectMemory(
  input: ReflectMemoryInput,
  options?: LearningMemoryOptions,
): Promise<ReflectMemoryResult> {
  return getLearningMemoryAdapter(options?.adapterId).reflect(input, options);
}
