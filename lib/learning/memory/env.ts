import type { LearningMemoryAdapterId } from "@/lib/learning/memory/types";

const ADAPTER_IDS: readonly LearningMemoryAdapterId[] = ["local", "hindsight"];

export const DEFAULT_LEARNING_BANK_ID = "aion-revenue-copilot";

export type HindsightEnv = {
  url: string;
  apiKey: string;
  bankId: string;
};

export function parseLearningMemoryAdapterId(
  value: string | undefined,
): LearningMemoryAdapterId {
  const normalized = value?.trim().toLowerCase();
  if (normalized && (ADAPTER_IDS as readonly string[]).includes(normalized)) {
    return normalized as LearningMemoryAdapterId;
  }
  return "local";
}

/**
 * Active learning-memory connector. Default: local (in-process, no network).
 * Switch with AION_LEARNING_MEMORY_ADAPTER=local|hindsight.
 */
export function getLearningMemoryAdapterId(): LearningMemoryAdapterId {
  return parseLearningMemoryAdapterId(process.env.AION_LEARNING_MEMORY_ADAPTER);
}

export function getDefaultLearningBankId(): string {
  return process.env.AION_LEARNING_BANK_ID?.trim() || DEFAULT_LEARNING_BANK_ID;
}

export function organizationLearningBankId(organizationId: string): string {
  const safe = organizationId.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
  return `org-${safe || "unknown"}`;
}

export function getHindsightEnv():
  | { ok: true; env: HindsightEnv }
  | { ok: false; error: string } {
  const url = process.env.AION_HINDSIGHT_URL?.trim();
  const apiKey = process.env.AION_HINDSIGHT_API_KEY?.trim();
  const bankId = getDefaultLearningBankId();

  if (!url) {
    return {
      ok: false,
      error:
        "Hindsight learning adapter is not configured. Set AION_HINDSIGHT_URL (and optionally AION_HINDSIGHT_API_KEY).",
    };
  }

  return {
    ok: true,
    env: {
      url,
      apiKey: apiKey ?? "",
      bankId,
    },
  };
}
