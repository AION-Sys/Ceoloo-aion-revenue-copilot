import type { ObjectionRecord, QualificationState } from "@/lib/sales/types";

export type PostCallOutcomeInput = {
  qualification: QualificationState;
  painPoints: string[];
  objections: ObjectionRecord[];
  nextAction: string;
  transcriptSummary?: string;
};

const QUALIFICATIONS: QualificationState[] = [
  "unqualified",
  "exploring",
  "qualified",
  "disqualified",
];

function isQualificationState(value: string): value is QualificationState {
  return QUALIFICATIONS.includes(value as QualificationState);
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseObjections(value: unknown): ObjectionRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const objections: ObjectionRecord[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as { objection?: unknown; resolved?: unknown; suggestedReframe?: unknown };
    if (typeof record.objection !== "string" || !record.objection.trim()) {
      continue;
    }

    const parsed: ObjectionRecord = {
      objection: record.objection.trim(),
      resolved: record.resolved === true,
    };

    if (typeof record.suggestedReframe === "string" && record.suggestedReframe.trim()) {
      parsed.suggestedReframe = record.suggestedReframe.trim();
    }

    objections.push(parsed);
  }

  return objections;
}

export function parsePostCallOutcomeInput(body: unknown): PostCallOutcomeInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const input = body as {
    qualification?: unknown;
    painPoints?: unknown;
    objections?: unknown;
    nextAction?: unknown;
    transcriptSummary?: unknown;
  };

  if (typeof input.qualification !== "string" || !isQualificationState(input.qualification)) {
    return null;
  }

  if (typeof input.nextAction !== "string" || !input.nextAction.trim()) {
    return null;
  }

  return {
    qualification: input.qualification,
    painPoints: parseStringList(input.painPoints),
    objections: parseObjections(input.objections),
    nextAction: input.nextAction.trim(),
    transcriptSummary:
      typeof input.transcriptSummary === "string" && input.transcriptSummary.trim()
        ? input.transcriptSummary.trim()
        : undefined,
  };
}
