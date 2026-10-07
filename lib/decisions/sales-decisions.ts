import { decide } from "@/lib/decisions/registry";
import type { DecideOptions } from "@/lib/decisions/adapter";
import type { DecisionResult } from "@/lib/decisions/types";
import type {
  BusinessContext,
  Lead,
  QualificationProfile,
  QualificationState,
} from "@/lib/sales/types";

export const QUALIFICATION_OPTIONS = [
  {
    id: "unqualified" as const,
    label: "Unqualified",
    description: "Insufficient signal to progress the funnel.",
  },
  {
    id: "exploring" as const,
    label: "Exploring",
    description: "Active discovery; more qualification still needed.",
  },
  {
    id: "qualified" as const,
    label: "Qualified",
    description: "Fit for the next AION implementation step.",
  },
  {
    id: "disqualified" as const,
    label: "Disqualified",
    description: "Not a fit — close the loop cleanly.",
  },
];

export const NEXT_ACTION_OPTIONS = [
  {
    id: "continue_discovery",
    label: "Continue discovery",
    description: "Stay in business audit / diagnosis; fill qualification gaps.",
  },
  {
    id: "propose_audit",
    label: "Propose business audit",
    description: "Offer a bounded audit before implementation commitment.",
  },
  {
    id: "scope_implementation",
    label: "Scope implementation",
    description: "Move toward solution/implementation scope.",
  },
  {
    id: "draft_proposal",
    label: "Draft proposal",
    description: "Commercial fit is clear enough for a proposal draft.",
  },
  {
    id: "park_follow_up",
    label: "Park with follow-up",
    description: "Timing or readiness is weak — schedule a follow-up.",
  },
];

export type SalesDecisionContext = {
  lead: Lead;
  context: BusinessContext;
  profile?: QualificationProfile;
  objections?: string[];
  buyingSignals?: string[];
  commitments?: string[];
  repNotes?: string;
};

/**
 * Score post-call qualification state. Returns a typed option — never chat parse.
 */
export async function decideQualification(
  input: SalesDecisionContext,
  options?: DecideOptions,
): Promise<DecisionResult & { qualification: QualificationState }> {
  const result = await decide(
    {
      decisionType: "sales.qualification",
      question:
        "Given the captured evidence, which qualification state best describes this opportunity?",
      options: [...QUALIFICATION_OPTIONS],
      state: buildState(input),
      contextSummary: summarize(input),
    },
    options,
  );

  const qualification = (QUALIFICATION_OPTIONS.find((o) => o.id === result.selectedOptionId)?.id ??
    "exploring") as QualificationState;

  return { ...result, qualification };
}

/**
 * Score the next-best commercial action after evidence capture.
 */
export async function decideNextBestAction(
  input: SalesDecisionContext,
  options?: DecideOptions,
): Promise<DecisionResult> {
  return decide(
    {
      decisionType: "sales.next_best_action",
      question: "What is the single best next action for the rep to take?",
      options: [...NEXT_ACTION_OPTIONS],
      state: buildState(input),
      contextSummary: summarize(input),
    },
    options,
  );
}

export const OBJECTION_HANDLING_OPTIONS = [
  {
    id: "acknowledge_and_quantify",
    label: "Acknowledge and quantify impact",
    description: "Validate the concern, then re-anchor on workflow cost.",
  },
  {
    id: "offer_bounded_audit",
    label: "Offer a bounded business audit",
    description: "Lower commitment risk with a diagnosis step.",
  },
  {
    id: "clarify_decision_maker",
    label: "Clarify decision maker / stakeholders",
    description: "Surface who else must agree before progress.",
  },
  {
    id: "park_and_follow_up",
    label: "Park and follow up",
    description: "Timing is real — protect the relationship with a dated follow-up.",
  },
];

export async function decideObjectionHandling(
  input: SalesDecisionContext & { objection: string },
  options?: DecideOptions,
): Promise<DecisionResult> {
  return decide(
    {
      decisionType: "sales.objection_handling",
      question: `How should the rep handle this objection: "${input.objection.trim()}"?`,
      options: [...OBJECTION_HANDLING_OPTIONS],
      state: {
        ...buildState(input),
        objection: input.objection.trim(),
      },
      contextSummary: summarize(input),
    },
    options,
  );
}

function buildState(input: SalesDecisionContext): Record<string, unknown> {
  return {
    companyName: input.lead.companyName,
    funnelStage: input.lead.status ?? "lead",
    industry: input.context.industry,
    existingSystems: input.context.existingSystems,
    workflowProblems: input.context.workflowProblems,
    recommendedService: input.context.recommendedService ?? null,
    qualificationProfile: input.profile ?? {},
    objections: input.objections ?? [],
    buyingSignals: input.buyingSignals ?? [],
    commitments: input.commitments ?? [],
    repNotes: input.repNotes ?? null,
  };
}

function summarize(input: SalesDecisionContext): string {
  const gaps = Object.entries(input.profile ?? {})
    .filter(([, v]) => !v)
    .map(([k]) => k);
  const filled = Object.entries(input.profile ?? {})
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);

  return [
    `${input.lead.companyName} (${input.context.industry})`,
    `stage=${input.lead.status ?? "lead"}`,
    `problems=${input.context.workflowProblems.join("|") || "none"}`,
    `systems=${input.context.existingSystems.join("|") || "none"}`,
    `filled=${filled.join("|") || "none"}`,
    `gaps=${gaps.join("|") || "none"}`,
    `objections=${(input.objections ?? []).join("|") || "none"}`,
  ].join("; ");
}
