import type { LearningMemoryAdapter, LearningMemoryOptions } from "@/lib/learning/memory/adapter";
import { localLearningMemoryAdapter } from "@/lib/learning/memory/adapters/local";
import { getHindsightEnv } from "@/lib/learning/memory/env";
import type {
  MemoryEpisodeKind,
  MemoryValence,
  RecallMemoryInput,
  RecallMemoryResult,
  ReflectMemoryInput,
  ReflectMemoryResult,
  RetainMemoryInput,
  RetainMemoryResult,
} from "@/lib/learning/memory/types";

type HindsightRecallBody = {
  results?: Array<{
    id?: string;
    text?: string;
    type?: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>;
  error?: { message?: string };
  message?: string;
  detail?: string;
};

type HindsightReflectBody = {
  text?: string;
  error?: { message?: string };
  message?: string;
  detail?: string;
};

type HindsightRetainBody = {
  operation_id?: string;
  document_ids?: string[];
  error?: { message?: string };
  message?: string;
  detail?: string;
};

/**
 * Hindsight connector — retain / recall / reflect over HTTP.
 * Switched on via AION_LEARNING_MEMORY_ADAPTER=hindsight.
 * Falls back to local when URL missing or request fails.
 */
export class HindsightLearningMemoryAdapter implements LearningMemoryAdapter {
  readonly id = "hindsight" as const;

  async retain(
    input: RetainMemoryInput,
    options?: LearningMemoryOptions,
  ): Promise<RetainMemoryResult> {
    const config = resolveHindsightConfig(options);
    if (!config) {
      return fallbackRetain(input, options, "missing_env");
    }

    try {
      const fetchFn = options?.fetch ?? fetch;
      const response = await fetchFn(
        `${config.baseUrl}/v1/default/banks/${encodeURIComponent(input.bankId)}/memories`,
        {
          method: "POST",
          headers: buildHeaders(config.apiKey),
          body: JSON.stringify({
            items: [
              {
                content: input.episode.content,
                context: input.episode.context ?? input.episode.kind,
                timestamp: input.episode.occurredAt,
                document_id: input.episode.id,
                tags: buildTags(input.episode.kind, input.episode.valence, input.episode.tags),
                metadata: {
                  ...(input.episode.metadata ?? {}),
                  aion_kind: input.episode.kind,
                  aion_valence: input.episode.valence,
                  aion_episode_id: input.episode.id,
                },
              },
            ],
            async: false,
          }),
        },
      );

      const body = (await response.json()) as HindsightRetainBody;
      if (!response.ok) {
        throw new Error(hindsightErrorMessage(response.status, body));
      }

      return {
        adapterId: this.id,
        bankId: input.bankId,
        episodeId: input.episode.id,
        accepted: true,
        providerId: body.operation_id ?? body.document_ids?.[0] ?? input.episode.id,
        rationale: "Retained via Hindsight memory bank.",
      };
    } catch (error) {
      return fallbackRetain(
        input,
        options,
        "request_failed",
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }

  async recall(
    input: RecallMemoryInput,
    options?: LearningMemoryOptions,
  ): Promise<RecallMemoryResult> {
    const config = resolveHindsightConfig(options);
    if (!config) {
      return withAdapterId(await localLearningMemoryAdapter.recall(input, options), this.id, {
        fallback: "local",
      });
    }

    try {
      const fetchFn = options?.fetch ?? fetch;
      const tags = input.kinds?.map((kind) => `kind:${kind}`);
      const response = await fetchFn(
        `${config.baseUrl}/v1/default/banks/${encodeURIComponent(input.bankId)}/memories/recall`,
        {
          method: "POST",
          headers: buildHeaders(config.apiKey),
          body: JSON.stringify({
            query: input.query,
            budget: "mid",
            max_tokens: 2048,
            ...(tags?.length ? { tags, tags_match: "any" } : {}),
          }),
        },
      );

      const body = (await response.json()) as HindsightRecallBody;
      if (!response.ok) {
        throw new Error(hindsightErrorMessage(response.status, body));
      }

      const hits = (body.results ?? [])
        .filter((row): row is { id: string; text: string; score?: number; metadata?: Record<string, unknown> } => {
          return typeof row.id === "string" && typeof row.text === "string";
        })
        .slice(0, input.limit ?? 5)
        .map((row) => ({
          id: row.id,
          text: row.text,
          score: typeof row.score === "number" ? row.score : 0,
          kind: asKind(row.metadata?.aion_kind),
          valence: asValence(row.metadata?.aion_valence),
          metadata: row.metadata,
        }));

      return {
        adapterId: this.id,
        bankId: input.bankId,
        query: input.query,
        hits,
      };
    } catch {
      const fallback = await localLearningMemoryAdapter.recall(input, options);
      return {
        ...fallback,
        adapterId: this.id,
      };
    }
  }

  async reflect(
    input: ReflectMemoryInput,
    options?: LearningMemoryOptions,
  ): Promise<ReflectMemoryResult> {
    const config = resolveHindsightConfig(options);
    if (!config) {
      const fallback = await localLearningMemoryAdapter.reflect(input, options);
      return { ...fallback, adapterId: this.id };
    }

    try {
      const fetchFn = options?.fetch ?? fetch;
      const response = await fetchFn(
        `${config.baseUrl}/v1/default/banks/${encodeURIComponent(input.bankId)}/reflect`,
        {
          method: "POST",
          headers: buildHeaders(config.apiKey),
          body: JSON.stringify({
            query: input.query,
            budget: "mid",
            ...(input.context ? { context: input.context } : {}),
          }),
        },
      );

      const body = (await response.json()) as HindsightReflectBody;
      if (!response.ok) {
        throw new Error(hindsightErrorMessage(response.status, body));
      }

      return {
        adapterId: this.id,
        bankId: input.bankId,
        query: input.query,
        text: typeof body.text === "string" && body.text.trim() ? body.text.trim() : "No reflection returned.",
      };
    } catch {
      const fallback = await localLearningMemoryAdapter.reflect(input, options);
      return { ...fallback, adapterId: this.id };
    }
  }
}

function resolveHindsightConfig(options?: LearningMemoryOptions): {
  baseUrl: string;
  apiKey: string;
} | null {
  const configured = getHindsightEnv();
  const url = options?.hindsightUrl?.trim() ?? (configured.ok ? configured.env.url : undefined);
  if (!url) return null;
  const apiKey =
    options?.hindsightApiKey?.trim() ?? (configured.ok ? configured.env.apiKey : "") ?? "";
  return { baseUrl: url.replace(/\/$/, ""), apiKey };
}

function buildHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "aion-revenue-copilot-learning/0.1",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

function buildTags(
  kind: MemoryEpisodeKind,
  valence: MemoryValence,
  extra?: string[],
): string[] {
  return [`kind:${kind}`, `valence:${valence}`, ...(extra ?? [])];
}

function hindsightErrorMessage(
  status: number,
  body: { error?: { message?: string }; message?: string; detail?: string },
): string {
  const detail = body.error?.message ?? body.message ?? body.detail;
  if (detail) {
    return `Hindsight request failed (${status}): ${detail}`;
  }
  return `Hindsight request failed (${status}).`;
}

async function fallbackRetain(
  input: RetainMemoryInput,
  options: LearningMemoryOptions | undefined,
  reason: string,
  detail?: string,
): Promise<RetainMemoryResult> {
  const fallback = await localLearningMemoryAdapter.retain(input, options);
  return {
    ...fallback,
    adapterId: "hindsight",
    rationale: `Hindsight unavailable (${reason}${detail ? `: ${detail}` : ""}); retained locally. ${
      fallback.rationale ?? ""
    }`.trim(),
  };
}

function withAdapterId(
  result: RecallMemoryResult,
  adapterId: "hindsight",
  _meta: { fallback: string },
): RecallMemoryResult {
  void _meta;
  return { ...result, adapterId };
}

function asKind(value: unknown): MemoryEpisodeKind | undefined {
  if (
    value === "call_outcome" ||
    value === "decision" ||
    value === "session" ||
    value === "test_run" ||
    value === "mistake" ||
    value === "practice"
  ) {
    return value;
  }
  return undefined;
}

function asValence(value: unknown): MemoryValence | undefined {
  if (value === "positive" || value === "negative" || value === "neutral") {
    return value;
  }
  return undefined;
}

export const hindsightLearningMemoryAdapter = new HindsightLearningMemoryAdapter();
