import type { MemoryEpisode } from "@/lib/learning/memory/types";

/**
 * Process-local memory bank store for the `local` adapter.
 * Survives within a Node process (dev/serverless warm instances) — not durable.
 * Durable learning uses the Hindsight adapter.
 */
const banks = new Map<string, MemoryEpisode[]>();

export function listLocalEpisodes(bankId: string): MemoryEpisode[] {
  return [...(banks.get(bankId) ?? [])];
}

export function appendLocalEpisode(bankId: string, episode: MemoryEpisode): void {
  const current = banks.get(bankId) ?? [];
  const withoutDup = current.filter((e) => e.id !== episode.id);
  withoutDup.push(episode);
  banks.set(bankId, withoutDup);
}

export function clearLocalBank(bankId: string): void {
  banks.delete(bankId);
}

export function clearAllLocalBanks(): void {
  banks.clear();
}

export function scoreEpisodeAgainstQuery(episode: MemoryEpisode, query: string): number {
  const qTokens = tokenize(query);
  if (!qTokens.length) return 0;

  const blob = tokenize(
    [
      episode.content,
      episode.context ?? "",
      episode.kind,
      episode.valence,
      ...(episode.tags ?? []),
      JSON.stringify(episode.metadata ?? {}),
    ].join(" "),
  );

  const set = new Set(blob);
  let hits = 0;
  for (const token of qTokens) {
    if (set.has(token)) hits += 1;
  }

  // Prefer recent positive practices slightly when scores tie later.
  const valenceBoost = episode.valence === "positive" ? 0.05 : episode.valence === "negative" ? 0.02 : 0;
  return hits / qTokens.length + valenceBoost;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length >= 2);
}
