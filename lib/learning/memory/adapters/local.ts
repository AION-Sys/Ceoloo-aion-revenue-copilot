import type { LearningMemoryAdapter, LearningMemoryOptions } from "@/lib/learning/memory/adapter";
import {
  appendLocalEpisode,
  listLocalEpisodes,
  scoreEpisodeAgainstQuery,
} from "@/lib/learning/memory/store";
import type {
  RecallMemoryInput,
  RecallMemoryResult,
  ReflectMemoryInput,
  ReflectMemoryResult,
  RetainMemoryInput,
  RetainMemoryResult,
} from "@/lib/learning/memory/types";

/**
 * Offline self-learning loop. Deterministic keyword recall + templated reflect.
 * Used in CI and when Hindsight is not configured.
 */
export class LocalLearningMemoryAdapter implements LearningMemoryAdapter {
  readonly id = "local" as const;

  async retain(
    input: RetainMemoryInput,
    _options?: LearningMemoryOptions,
  ): Promise<RetainMemoryResult> {
    void _options;
    appendLocalEpisode(input.bankId, input.episode);
    return {
      adapterId: this.id,
      bankId: input.bankId,
      episodeId: input.episode.id,
      accepted: true,
      providerId: `local:${input.episode.id}`,
      rationale: "Retained in process-local learning bank.",
    };
  }

  async recall(
    input: RecallMemoryInput,
    _options?: LearningMemoryOptions,
  ): Promise<RecallMemoryResult> {
    void _options;
    const limit = input.limit ?? 5;
    const kindSet = input.kinds ? new Set(input.kinds) : null;
    const scored = listLocalEpisodes(input.bankId)
      .filter((episode) => (kindSet ? kindSet.has(episode.kind) : true))
      .map((episode) => ({
        episode,
        score: scoreEpisodeAgainstQuery(episode, input.query),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      adapterId: this.id,
      bankId: input.bankId,
      query: input.query,
      hits: scored.map(({ episode, score }) => ({
        id: episode.id,
        text: episode.content,
        score,
        kind: episode.kind,
        valence: episode.valence,
        occurredAt: episode.occurredAt,
        metadata: episode.metadata,
      })),
    };
  }

  async reflect(
    input: ReflectMemoryInput,
    options?: LearningMemoryOptions,
  ): Promise<ReflectMemoryResult> {
    const recalled = await this.recall(
      {
        bankId: input.bankId,
        query: [input.query, input.context ?? ""].join(" "),
        limit: 5,
      },
      options,
    );

    if (!recalled.hits.length) {
      return {
        adapterId: this.id,
        bankId: input.bankId,
        query: input.query,
        text: "No retained learning episodes match this query yet. Capture outcomes, test runs, mistakes, and practices to grow the loop.",
        citedEpisodeIds: [],
      };
    }

    const lines = recalled.hits.map((hit, index) => {
      const label = hit.kind ? `[${hit.kind}/${hit.valence ?? "neutral"}]` : "[memory]";
      return `${index + 1}. ${label} ${hit.text}`;
    });

    return {
      adapterId: this.id,
      bankId: input.bankId,
      query: input.query,
      text: [
        `Based on ${recalled.hits.length} retained episode(s):`,
        ...lines,
        "Prefer repeating positive practices; avoid repeating tagged mistakes.",
      ].join("\n"),
      citedEpisodeIds: recalled.hits.map((h) => h.id),
    };
  }
}

export const localLearningMemoryAdapter = new LocalLearningMemoryAdapter();
