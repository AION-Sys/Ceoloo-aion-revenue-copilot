import type { LearningMemoryOptions } from "@/lib/learning/memory/adapter";
import {
  episodeFromCallOutcome,
  episodeFromDecision,
  episodeFromLearningEvent,
  episodeFromMistake,
  episodeFromPractice,
  episodeFromSession,
  episodeFromTestRun,
} from "@/lib/learning/memory/episodes";
import {
  getDefaultLearningBankId,
  organizationLearningBankId,
} from "@/lib/learning/memory/env";
import { recallMemory, reflectMemory, retainMemory } from "@/lib/learning/memory/registry";
import type {
  RecallMemoryResult,
  ReflectMemoryResult,
  RetainMemoryResult,
} from "@/lib/learning/memory/types";
import type { CallOutcome, Lead, LearningEvent } from "@/lib/sales/types";

function resolveBankId(options?: LearningMemoryOptions & { organizationId?: string }): string {
  if (options?.bankId?.trim()) return options.bankId.trim();
  if (options?.organizationId?.trim()) {
    return organizationLearningBankId(options.organizationId);
  }
  return getDefaultLearningBankId();
}

/** Retain a structured call outcome into the learning loop. */
export async function retainCallOutcomeLearning(
  input: { lead: Lead; outcome: CallOutcome; intervention?: string },
  options?: LearningMemoryOptions,
): Promise<RetainMemoryResult> {
  return retainMemory(
    {
      bankId: resolveBankId({ ...options, organizationId: input.lead.organizationId }),
      episode: episodeFromCallOutcome(input),
    },
    options,
  );
}

/** Retain a mapped learning event (also used by ingestLearningEvent). */
export async function retainLearningEventMemory(
  event: LearningEvent,
  options?: LearningMemoryOptions & { organizationId?: string },
): Promise<RetainMemoryResult> {
  return retainMemory(
    {
      bankId: resolveBankId(options),
      episode: episodeFromLearningEvent(event),
    },
    options,
  );
}

export async function retainDecisionLearning(
  input: Parameters<typeof episodeFromDecision>[0],
  options?: LearningMemoryOptions & { organizationId?: string },
): Promise<RetainMemoryResult> {
  return retainMemory(
    {
      bankId: resolveBankId(options),
      episode: episodeFromDecision(input),
    },
    options,
  );
}

export async function retainSessionLearning(
  input: Parameters<typeof episodeFromSession>[0],
  options?: LearningMemoryOptions,
): Promise<RetainMemoryResult> {
  return retainMemory(
    {
      bankId: resolveBankId({ ...options, organizationId: input.organizationId }),
      episode: episodeFromSession(input),
    },
    options,
  );
}

export async function retainTestRunLearning(
  input: Parameters<typeof episodeFromTestRun>[0],
  options?: LearningMemoryOptions & { organizationId?: string },
): Promise<RetainMemoryResult> {
  return retainMemory(
    {
      bankId: resolveBankId(options),
      episode: episodeFromTestRun(input),
    },
    options,
  );
}

export async function retainMistakeLearning(
  input: Parameters<typeof episodeFromMistake>[0],
  options?: LearningMemoryOptions & { organizationId?: string },
): Promise<RetainMemoryResult> {
  return retainMemory(
    {
      bankId: resolveBankId(options),
      episode: episodeFromMistake(input),
    },
    options,
  );
}

export async function retainPracticeLearning(
  input: Parameters<typeof episodeFromPractice>[0],
  options?: LearningMemoryOptions & { organizationId?: string },
): Promise<RetainMemoryResult> {
  return retainMemory(
    {
      bankId: resolveBankId(options),
      episode: episodeFromPractice(input),
    },
    options,
  );
}

/** Recall practices/mistakes relevant to live guidance. */
export async function recallGuidanceLessons(
  input: { companyName: string; objection?: string; workflowProblem?: string; organizationId?: string },
  options?: LearningMemoryOptions,
): Promise<RecallMemoryResult> {
  const parts = [
    input.companyName,
    input.objection ?? "",
    input.workflowProblem ?? "",
    "practice mistake objection next action",
  ];
  return recallMemory(
    {
      bankId: resolveBankId({ ...options, organizationId: input.organizationId }),
      query: parts.filter(Boolean).join(" "),
      kinds: ["practice", "mistake", "call_outcome", "decision"],
      limit: 5,
    },
    options,
  );
}

/** Reflect on what the bank has learned about a sales question. */
export async function reflectSalesLearning(
  input: { question: string; context?: string; organizationId?: string },
  options?: LearningMemoryOptions,
): Promise<ReflectMemoryResult> {
  return reflectMemory(
    {
      bankId: resolveBankId({ ...options, organizationId: input.organizationId }),
      query: input.question,
      context: input.context,
    },
    options,
  );
}
