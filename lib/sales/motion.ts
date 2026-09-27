import type {
  BusinessContext,
  FunnelStage,
  Lead,
  QualificationProfile,
} from "@/lib/sales/types";

/**
 * AION's current sales motion.
 * The copilot qualifies implementation opportunities. It does not underwrite funding.
 */
export const FUNNEL_STAGES: readonly FunnelStage[] = [
  "lead",
  "business_audit",
  "problem_diagnosis",
  "qualified_opportunity",
  "solution_scope",
  "proposal",
  "closed_won",
  "onboarding",
];

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  lead: "Lead",
  business_audit: "Business Audit",
  problem_diagnosis: "Problem/Workflow Diagnosis",
  qualified_opportunity: "Qualified Opportunity",
  solution_scope: "Solution/Implementation Scope",
  proposal: "Proposal",
  closed_won: "Closed Won",
  onboarding: "Onboarding",
};

export type QualificationDimension = {
  id: string;
  profileKey: keyof QualificationProfile;
  label: string;
  checklist: string;
  question: (lead: Lead, context: BusinessContext) => string;
};

export const QUALIFICATION_DIMENSIONS: readonly QualificationDimension[] = [
  {
    id: "current_workflow",
    profileKey: "currentWorkflow",
    label: "Current workflow/problem",
    checklist: "Capture the current workflow and the problem it creates",
    question: (lead) =>
      `Walk through the current workflow at ${lead.companyName} and where it breaks down.`,
  },
  {
    id: "business_impact",
    profileKey: "businessImpact",
    label: "Business impact",
    checklist: "Quantify business impact in time, revenue, errors, or capacity",
    question: (_lead, context) =>
      context.workflowProblems[0]
        ? `When ${context.workflowProblems[0]} happens, what does that cost the business?`
        : "What business impact does the current workflow create?",
  },
  {
    id: "existing_systems",
    profileKey: "existingSystems",
    label: "Existing systems/tools",
    checklist: "List the systems and tools already in the workflow",
    question: (_lead, context) =>
      context.existingSystems.length > 0
        ? `Which of these systems are in the workflow today: ${context.existingSystems.join(", ")}? Where do they fail to connect?`
        : "Which systems and tools does the team use today?",
  },
  {
    id: "automation_opportunity",
    profileKey: "automationOpportunity",
    label: "Automation opportunity",
    checklist: "Name the automation opportunity",
    question: () =>
      "Where is the clearest automation opportunity if the rest of the workflow stayed the same?",
  },
  {
    id: "decision_maker",
    profileKey: "decisionMaker",
    label: "Decision maker",
    checklist: "Identify the decision maker and who else must be involved",
    question: () => "Who can approve an implementation, and who else needs to be involved?",
  },
  {
    id: "implementation_readiness",
    profileKey: "implementationReadiness",
    label: "Implementation readiness",
    checklist: "Gauge implementation readiness",
    question: () =>
      "How ready is the team to change this workflow in the next implementation cycle?",
  },
  {
    id: "urgency_timeline",
    profileKey: "urgencyTimeline",
    label: "Urgency/timeline",
    checklist: "Confirm urgency and timeline",
    question: () => "What timeline should we plan around, and how urgent is the problem?",
  },
  {
    id: "budget_fit",
    profileKey: "budgetFit",
    label: "Budget/commercial fit",
    checklist: "Check budget and commercial fit for an AION engagement",
    question: () => "What budget or commercial constraints should a proposal respect?",
  },
  {
    id: "recommended_service",
    profileKey: "recommendedService",
    label: "Recommended AION service",
    checklist: "Recommend an AION service and the next funnel step",
    question: (_lead, context) =>
      context.recommendedService
        ? `Does ${context.recommendedService} fit, or should we recommend a different AION service?`
        : "Which AION service fits: a business audit, a workflow diagnosis, or an implementation engagement?",
  },
];

const LEGACY_LEAD_STATUS: Record<string, FunnelStage> = {
  new: "lead",
  contacted: "business_audit",
  qualified: "qualified_opportunity",
  closed: "closed_won",
  funded: "closed_won",
};

const FUNNEL_STAGE_SET = new Set<string>(FUNNEL_STAGES);

export function isFunnelStage(value: string): value is FunnelStage {
  return FUNNEL_STAGE_SET.has(value);
}

export function funnelStageLabel(stage: FunnelStage | undefined): string {
  if (!stage) {
    return FUNNEL_STAGE_LABELS.lead;
  }
  return FUNNEL_STAGE_LABELS[stage];
}

export function formatFunnelPath(): string {
  return FUNNEL_STAGES.map((stage) => FUNNEL_STAGE_LABELS[stage]).join(" → ");
}

/** Maps stored or legacy funding-era statuses onto the current funnel. */
export function normalizeLeadStatus(value: string | null | undefined): FunnelStage {
  if (!value) {
    return "lead";
  }
  if (isFunnelStage(value)) {
    return value;
  }
  return LEGACY_LEAD_STATUS[value] ?? "lead";
}

export function isOpenFunnelStage(stage: FunnelStage | undefined): boolean {
  return stage !== "closed_won";
}

export function isQualifiedFunnelStage(stage: FunnelStage | undefined): boolean {
  return (
    stage === "qualified_opportunity" ||
    stage === "solution_scope" ||
    stage === "proposal"
  );
}

export function isConversationStage(stage: FunnelStage | undefined): boolean {
  return (
    stage === "business_audit" ||
    stage === "problem_diagnosis" ||
    stage === "qualified_opportunity" ||
    stage === "solution_scope" ||
    stage === "proposal"
  );
}

export function discoveryChecklist(): string[] {
  return QUALIFICATION_DIMENSIONS.map((dimension) => dimension.checklist);
}

export function buildQualificationQuestions(lead: Lead, context: BusinessContext): string[] {
  return QUALIFICATION_DIMENSIONS.map((dimension) => dimension.question(lead, context));
}

export function buildAgentSystemPrompt(): string {
  const dimensions = QUALIFICATION_DIMENSIONS.map((dimension) => dimension.label).join("; ");

  return [
    "You are the AION Revenue Copilot, coaching a rep through AION's implementation sales motion.",
    `Funnel, in order: ${formatFunnelPath()}.`,
    `Qualify the opportunity only on these dimensions: ${dimensions}.`,
    "AION sells business audits, workflow diagnosis, and implementation services.",
    "When handling an objection, reply with one concise reframe (2 sentences max) that ties the concern to workflow impact, implementation fit, or the next funnel step.",
  ].join(" ");
}

export function nextActionForStage(stage: FunnelStage | undefined): string {
  switch (stage) {
    case "lead":
      return "Open the pre-call brief and start the business audit.";
    case "business_audit":
      return "Capture the current workflow and the systems already in use.";
    case "problem_diagnosis":
      return "Quantify business impact and name the automation opportunity.";
    case "qualified_opportunity":
      return "Confirm the decision maker, implementation readiness, and commercial fit.";
    case "solution_scope":
      return "Shape the implementation scope and the recommended AION service.";
    case "proposal":
      return "Advance the proposal and confirm the path to close.";
    case "closed_won":
      return "Start onboarding and confirm what the implementation includes.";
    case "onboarding":
      return "Confirm onboarding steps and the implementation handoff.";
    default:
      return "Review the workflow context and choose the next funnel step.";
  }
}
