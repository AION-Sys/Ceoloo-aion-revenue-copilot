export type {
  LearningMemoryAdapterId,
  MemoryEpisode,
  MemoryEpisodeKind,
  MemoryValence,
  RecallMemoryHit,
  RecallMemoryInput,
  RecallMemoryResult,
  ReflectMemoryInput,
  ReflectMemoryResult,
  RetainMemoryInput,
  RetainMemoryResult,
} from "@/lib/learning/memory/types";

export type { LearningMemoryAdapter, LearningMemoryOptions } from "@/lib/learning/memory/adapter";
export {
  DEFAULT_LEARNING_BANK_ID,
  getDefaultLearningBankId,
  getHindsightEnv,
  getLearningMemoryAdapterId,
  organizationLearningBankId,
  parseLearningMemoryAdapterId,
} from "@/lib/learning/memory/env";
export {
  getLearningMemoryAdapter,
  listLearningMemoryAdapters,
  recallMemory,
  reflectMemory,
  retainMemory,
} from "@/lib/learning/memory/registry";
export {
  episodeFromCallOutcome,
  episodeFromDecision,
  episodeFromIntervention,
  episodeFromLearningEvent,
  episodeFromMistake,
  episodeFromPractice,
  episodeFromSession,
  episodeFromTestRun,
} from "@/lib/learning/memory/episodes";
export {
  recallGuidanceLessons,
  reflectSalesLearning,
  retainCallOutcomeLearning,
  retainDecisionLearning,
  retainInterventionLearning,
  retainLearningEventMemory,
  retainMistakeLearning,
  retainPracticeLearning,
  retainSessionLearning,
  retainTestRunLearning,
} from "@/lib/learning/memory/loop";
export { clearAllLocalBanks, clearLocalBank, listLocalEpisodes } from "@/lib/learning/memory/store";
export { localLearningMemoryAdapter } from "@/lib/learning/memory/adapters/local";
export { hindsightLearningMemoryAdapter } from "@/lib/learning/memory/adapters/hindsight";
export { ensureDemoLearningMemory } from "@/lib/learning/memory/demo-seed";
