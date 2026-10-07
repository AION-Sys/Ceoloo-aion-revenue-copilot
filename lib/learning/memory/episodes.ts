import type { InterventionRecord } from "@/lib/learning/interventions";
import type { LearningEvent } from "@/lib/sales/types";
import type { CallOutcome, Lead, QualificationState } from "@/lib/sales/types";
import type {
  MemoryEpisode,
  MemoryEpisodeKind,
  MemoryValence,
} from "@/lib/learning/memory/types";

export function episodeId(kind: MemoryEpisodeKind, seed: string): string {
  const safe = seed.trim().replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "anon";
  return `${kind}-${safe}`;
}

export function valenceFromQualification(qualification: QualificationState): MemoryValence {
  if (qualification === "qualified") return "positive";
  if (qualification === "disqualified") return "negative";
  return "neutral";
}

export function episodeFromCallOutcome(input: {
  lead: Lead;
  outcome: CallOutcome;
  intervention?: string;
  interventionId?: string;
}): MemoryEpisode {
  const valence = valenceFromQualification(input.outcome.qualification);
  const pains = input.outcome.painPoints.slice(0, 3).join("; ") || "none";
  const objections = input.outcome.objections
    .map((o) => o.objection)
    .slice(0, 3)
    .join("; ") || "none";

  return {
    id: episodeId("call_outcome", input.outcome.id),
    kind: "call_outcome",
    valence,
    occurredAt: input.outcome.occurredAt,
    context: "post-call outcome",
    content: [
      `Call outcome for ${input.lead.companyName}: qualification=${input.outcome.qualification}.`,
      `Next action: ${input.outcome.nextAction}.`,
      `Pains: ${pains}.`,
      `Objections: ${objections}.`,
      input.intervention ? `Intervention: ${input.intervention}.` : "",
      input.interventionId ? `Intervention id: ${input.interventionId}.` : "",
      input.outcome.transcriptSummary ? `Summary: ${input.outcome.transcriptSummary}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    metadata: {
      leadId: input.lead.id,
      organizationId: input.lead.organizationId,
      qualification: input.outcome.qualification,
      nextAction: input.outcome.nextAction,
      ...(input.interventionId ? { interventionId: input.interventionId } : {}),
    },
    tags: [
      `company:${slug(input.lead.companyName)}`,
      `qualification:${input.outcome.qualification}`,
      ...(input.interventionId ? [`intervention:${input.interventionId}`] : []),
    ],
  };
}

export function episodeFromIntervention(record: InterventionRecord): MemoryEpisode {
  const valence: MemoryValence =
    record.useful === true ? "positive" : record.useful === false ? "negative" : "neutral";

  return {
    id: episodeId("intervention", record.interventionId),
    kind: "intervention",
    valence,
    occurredAt: record.occurredAt,
    context: `intervention:${record.kind}`,
    content: [
      `Intervention ${record.interventionId} (${record.kind}).`,
      record.pattern ? `Pattern: ${record.pattern}.` : "",
      `Recommendation: ${record.recommendation}.`,
      record.repUsed === true
        ? "Rep used it."
        : record.repUsed === false
          ? "Rep did not use it."
          : "Rep use unknown.",
      record.prospectResponse ? `Prospect response: ${record.prospectResponse}.` : "",
      record.stageBefore || record.stageAfter
        ? `Stage: ${record.stageBefore ?? "—"} → ${record.stageAfter ?? "—"}.`
        : "",
      record.eventualOutcome ? `Outcome: ${record.eventualOutcome}.` : "",
      typeof record.revenueCents === "number"
        ? `Revenue cents: ${record.revenueCents}.`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    metadata: {
      interventionId: record.interventionId,
      kind: record.kind,
      pattern: record.pattern ?? null,
      recommendation: record.recommendation,
      repUsed: record.repUsed,
      useful: record.useful,
      prospectResponse: record.prospectResponse ?? null,
      stageBefore: record.stageBefore ?? null,
      stageAfter: record.stageAfter ?? null,
      eventualOutcome: record.eventualOutcome ?? null,
      revenueCents: record.revenueCents ?? null,
      callId: record.callId ?? null,
      leadId: record.leadId ?? null,
      organizationId: record.organizationId ?? null,
    },
    tags: [
      `intervention:${record.interventionId}`,
      `kind:${record.kind}`,
      record.useful === true ? "useful:yes" : record.useful === false ? "useful:no" : "useful:pending",
      record.repUsed === true ? "rep_used:yes" : record.repUsed === false ? "rep_used:no" : "rep_used:pending",
    ],
  };
}

export function episodeFromLearningEvent(event: LearningEvent): MemoryEpisode {
  const qualification =
    typeof event.payload.qualification === "string"
      ? (event.payload.qualification as QualificationState)
      : "exploring";
  const leadId = typeof event.payload.leadId === "string" ? event.payload.leadId : "unknown";

  return {
    id: episodeId("call_outcome", `${leadId}-${event.occurredAt}`),
    kind: "call_outcome",
    valence: valenceFromQualification(qualification),
    occurredAt: event.occurredAt,
    context: event.eventType,
    content: `Learning event ${event.eventType}: ${JSON.stringify(event.payload)}`,
    metadata: { ...event.payload, eventType: event.eventType },
    tags: [`event:${event.eventType}`, `qualification:${qualification}`],
  };
}

export function episodeFromDecision(input: {
  decisionType: string;
  selectedOptionId: string;
  confidence: number;
  rationale?: string;
  useful?: boolean | null;
  occurredAt?: string;
  seed?: string;
}): MemoryEpisode {
  const valence: MemoryValence =
    input.useful === true ? "positive" : input.useful === false ? "negative" : "neutral";
  const when = input.occurredAt ?? new Date().toISOString();

  return {
    id: episodeId("decision", input.seed ?? `${input.decisionType}-${when}`),
    kind: "decision",
    valence,
    occurredAt: when,
    context: input.decisionType,
    content: [
      `Decision ${input.decisionType} selected ${input.selectedOptionId}`,
      `(confidence ${input.confidence.toFixed(2)}).`,
      input.rationale ? `Rationale: ${input.rationale}` : "",
      input.useful === true
        ? "Marked useful."
        : input.useful === false
          ? "Marked not useful."
          : "",
    ]
      .filter(Boolean)
      .join(" "),
    metadata: {
      decisionType: input.decisionType,
      selectedOptionId: input.selectedOptionId,
      confidence: input.confidence,
      useful: input.useful ?? null,
    },
    tags: [`decision:${input.decisionType}`, `option:${input.selectedOptionId}`],
  };
}

export function episodeFromSession(input: {
  sessionId: string;
  organizationId: string;
  summary: string;
  useful?: boolean | null;
  occurredAt?: string;
}): MemoryEpisode {
  const valence: MemoryValence =
    input.useful === true ? "positive" : input.useful === false ? "negative" : "neutral";
  const when = input.occurredAt ?? new Date().toISOString();

  return {
    id: episodeId("session", input.sessionId),
    kind: "session",
    valence,
    occurredAt: when,
    context: "rep session",
    content: `Session ${input.sessionId} (org ${input.organizationId}): ${input.summary}`,
    metadata: {
      sessionId: input.sessionId,
      organizationId: input.organizationId,
      useful: input.useful ?? null,
    },
    tags: [`org:${slug(input.organizationId)}`],
  };
}

export function episodeFromTestRun(input: {
  suite: string;
  passed: boolean;
  summary: string;
  failures?: string[];
  occurredAt?: string;
}): MemoryEpisode {
  const when = input.occurredAt ?? new Date().toISOString();
  const kind: MemoryEpisodeKind = input.passed ? "test_run" : "mistake";
  const valence: MemoryValence = input.passed ? "positive" : "negative";

  return {
    id: episodeId(kind, `${input.suite}-${when}`),
    kind,
    valence,
    occurredAt: when,
    context: `test:${input.suite}`,
    content: [
      `Test suite ${input.suite} ${input.passed ? "passed" : "failed"}.`,
      input.summary,
      input.failures?.length ? `Failures: ${input.failures.join("; ")}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    metadata: {
      suite: input.suite,
      passed: input.passed,
      failures: input.failures ?? [],
    },
    tags: [`suite:${slug(input.suite)}`, input.passed ? "result:pass" : "result:fail"],
  };
}

export function episodeFromMistake(input: {
  title: string;
  detail: string;
  source?: string;
  occurredAt?: string;
  seed?: string;
}): MemoryEpisode {
  const when = input.occurredAt ?? new Date().toISOString();
  return {
    id: episodeId("mistake", input.seed ?? `${input.title}-${when}`),
    kind: "mistake",
    valence: "negative",
    occurredAt: when,
    context: input.source ?? "operator-marked mistake",
    content: `Mistake: ${input.title}. ${input.detail}`,
    metadata: { title: input.title, source: input.source ?? null },
    tags: ["review:mistake"],
  };
}

export function episodeFromPractice(input: {
  title: string;
  detail: string;
  source?: string;
  occurredAt?: string;
  seed?: string;
}): MemoryEpisode {
  const when = input.occurredAt ?? new Date().toISOString();
  return {
    id: episodeId("practice", input.seed ?? `${input.title}-${when}`),
    kind: "practice",
    valence: "positive",
    occurredAt: when,
    context: input.source ?? "operator-marked practice",
    content: `Good practice: ${input.title}. ${input.detail}`,
    metadata: { title: input.title, source: input.source ?? null },
    tags: ["review:practice"],
  };
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "na";
}
