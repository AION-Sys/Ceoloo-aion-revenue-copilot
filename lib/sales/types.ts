/**
 * Core domain types for the conversion copilot.
 * Sales motion: AION implementation funnel — see lib/sales/motion.ts.
 */

export type FunnelStage =
  | "lead"
  | "business_audit"
  | "problem_diagnosis"
  | "qualified_opportunity"
  | "solution_scope"
  | "proposal"
  | "closed_won"
  | "onboarding";

export type LeadStatus = FunnelStage;

export type Lead = {
  id: string;
  organizationId: string;
  companyName: string;
  contactName?: string;
  source?: string;
  status?: LeadStatus;
  businessContextId?: string;
};

/**
 * What the copilot knows about a prospect account.
 * Describes the workflow AION might implement — not a funding application.
 */
export type BusinessContext = {
  id: string;
  organizationId: string;
  industry: string;
  /** Systems and tools already in the prospect's workflow. */
  existingSystems: string[];
  /** Current workflow problems to diagnose. */
  workflowProblems: string[];
  /** Recommended AION service when one has been identified. */
  recommendedService?: string;
};

export type QualificationState = "unqualified" | "exploring" | "qualified" | "disqualified";

/**
 * Qualification snapshot for an AION implementation opportunity.
 * Keys match the sales-motion dimensions. Funding fields are not part of this schema.
 */
export type QualificationProfile = {
  currentWorkflow?: string;
  businessImpact?: string;
  existingSystems?: string;
  automationOpportunity?: string;
  decisionMaker?: string;
  implementationReadiness?: string;
  urgencyTimeline?: string;
  budgetFit?: string;
  recommendedService?: string;
};

export type CallOutcome = {
  id: string;
  leadId: string;
  painPoints: string[];
  objections: ObjectionRecord[];
  qualification: QualificationState;
  qualificationProfile?: QualificationProfile;
  nextAction: string;
  transcriptSummary?: string;
  occurredAt: string;
};

export type ObjectionRecord = {
  objection: string;
  suggestedReframe?: string;
  resolved: boolean;
};

export type LearningEvent = {
  eventType: "call_outcome" | "objection_pattern" | "qualification_shift";
  payload: Record<string, unknown>;
  occurredAt: string;
};

export type CrmEvent = {
  eventType: "lead_updated" | "call_completed" | "next_action_scheduled";
  leadId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};
