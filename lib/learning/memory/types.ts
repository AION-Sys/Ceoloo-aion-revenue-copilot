/**
 * Provider-agnostic learning memory contract (Hindsight-shaped).
 *
 * Core ops: retain → recall → reflect.
 * Product code never binds to a vendor SDK — adapters are switched via env.
 */

export type LearningMemoryAdapterId = "local" | "hindsight";

/**
 * What kind of episode is being retained into the self-learning loop.
 */
export type MemoryEpisodeKind =
  | "call_outcome"
  | "decision"
  | "session"
  | "test_run"
  | "mistake"
  | "practice";

export type MemoryValence = "positive" | "negative" | "neutral";

export type MemoryEpisode = {
  id: string;
  kind: MemoryEpisodeKind;
  valence: MemoryValence;
  /** Human-readable content retained into the bank. */
  content: string;
  /** Short retain context (Hindsight `context`). */
  context?: string;
  /** Occurred-at ISO timestamp. */
  occurredAt: string;
  /** Free-form structured fields for local search + Hindsight metadata. */
  metadata?: Record<string, unknown>;
  tags?: string[];
};

export type RetainMemoryInput = {
  bankId: string;
  episode: MemoryEpisode;
};

export type RetainMemoryResult = {
  adapterId: LearningMemoryAdapterId;
  bankId: string;
  episodeId: string;
  accepted: boolean;
  /** Provider document/operation id when available. */
  providerId?: string;
  rationale?: string;
};

export type RecallMemoryInput = {
  bankId: string;
  query: string;
  /** Prefer certain episode kinds via tags. */
  kinds?: MemoryEpisodeKind[];
  limit?: number;
};

export type RecallMemoryHit = {
  id: string;
  text: string;
  score: number;
  kind?: MemoryEpisodeKind;
  valence?: MemoryValence;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
};

export type RecallMemoryResult = {
  adapterId: LearningMemoryAdapterId;
  bankId: string;
  query: string;
  hits: RecallMemoryHit[];
};

export type ReflectMemoryInput = {
  bankId: string;
  query: string;
  context?: string;
};

export type ReflectMemoryResult = {
  adapterId: LearningMemoryAdapterId;
  bankId: string;
  query: string;
  text: string;
  citedEpisodeIds?: string[];
};
