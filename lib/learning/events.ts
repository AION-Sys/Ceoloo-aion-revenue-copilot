import { retainLearningEventMemory } from "@/lib/learning/memory/loop";
import type { LearningMemoryOptions } from "@/lib/learning/memory/adapter";
import type { CallOutcome, LearningEvent } from "@/lib/sales/types";

export function outcomeToLearningEvent(outcome: CallOutcome): LearningEvent {
  return {
    eventType: "call_outcome",
    payload: {
      leadId: outcome.leadId,
      qualification: outcome.qualification,
      qualificationProfile: outcome.qualificationProfile ?? {},
      objectionCount: outcome.objections.length,
      painPointCount: outcome.painPoints.length,
      nextAction: outcome.nextAction,
    },
    occurredAt: outcome.occurredAt,
  };
}

export type LearningIngestResult = {
  accepted: boolean;
  eventId?: string;
  /** Learning-memory retain ack when the self-learning loop is enabled. */
  memoryEpisodeId?: string;
  memoryAdapterId?: string;
};

export type LearningIngestOptions = LearningMemoryOptions & {
  ingestUrl?: string;
  apiKey?: string;
  organizationId?: string;
  /** When false, skip retain into learning memory (default true). */
  retainMemory?: boolean;
};

/**
 * Sends learning events to AION learning infrastructure and retains them
 * into the switchable self-learning memory loop (local | Hindsight).
 * HTTP ingest remains stubbed until AION_EVENTS_INGEST_URL is wired (Task 8).
 */
export async function ingestLearningEvent(
  event: LearningEvent,
  options?: LearningIngestOptions,
): Promise<LearningIngestResult> {
  if (!event.eventType || !event.occurredAt) {
    return { accepted: false };
  }

  const eventId = `evt-${Date.now()}`;
  const shouldRetain = options?.retainMemory !== false;

  if (!shouldRetain) {
    return { accepted: true, eventId };
  }

  try {
    const memory = await retainLearningEventMemory(event, options);
    return {
      accepted: memory.accepted,
      eventId,
      memoryEpisodeId: memory.episodeId,
      memoryAdapterId: memory.adapterId,
    };
  } catch {
    // Ingest must not fail the sales path if memory retain errors.
    return { accepted: true, eventId };
  }
}
