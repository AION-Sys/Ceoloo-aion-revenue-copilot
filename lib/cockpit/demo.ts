import {
  DEMO_CALL_ID,
  DEMO_LEAD_ID,
  DEMO_ORG_ID,
} from "@/lib/auth/demo";
import { DEMO_LEAD } from "@/lib/demo/fixtures";
import type {
  CrmChangeProposal,
  FollowUpDraft,
  InteractionEvent,
  LearningSignal,
} from "@/lib/cockpit/types";
import type { QualificationProfile } from "@/lib/sales/types";

export const DEMO_QUALIFICATION_PROFILE: QualificationProfile = {
  currentWorkflow: "Manual phone follow-up and spreadsheet job tracking",
  businessImpact: "Missed same-day leads and unclear job status",
  existingSystems: "Phone/voicemail, spreadsheets, QuickBooks",
  automationOpportunity: "Lead intake → follow-up sequence → job status sync",
  decisionMaker: "Jordan Lee (owner)",
  // Intentionally incomplete so Prospect Workspace shows gaps.
};

export const DEMO_INTERACTIONS: InteractionEvent[] = [
  {
    id: "demo-outcome-note",
    leadId: DEMO_LEAD_ID,
    kind: "note",
    title: "Outbound touch logged",
    detail: "Cold email answered — booked discovery",
    occurredAt: "2026-10-05T15:00:00.000Z",
  },
  {
    id: "demo-prep",
    leadId: DEMO_LEAD_ID,
    kind: "prep_opened",
    title: "Call prep opened",
    detail: "Rep reviewed brief before dialing",
    occurredAt: "2026-10-06T13:55:00.000Z",
  },
  {
    id: "demo-call",
    leadId: DEMO_LEAD_ID,
    kind: "call_started",
    title: "Discovery call started",
    detail: `Call ${DEMO_CALL_ID}`,
    occurredAt: "2026-10-06T14:00:00.000Z",
  },
];

export const DEMO_CRM_PROPOSALS: CrmChangeProposal[] = [
  {
    id: "demo-crm-1",
    leadId: DEMO_LEAD_ID,
    field: "status",
    fromValue: "lead",
    toValue: "business_audit",
    reason: "Exploring qualification after discovery call",
    evidenceState: "draft",
  },
  {
    id: "demo-crm-2",
    leadId: DEMO_LEAD_ID,
    field: "note",
    fromValue: "(none)",
    toValue: "Pain: manual lead follow-up; next: send audit agenda",
    reason: "Post-call structured note proposal",
    evidenceState: "draft",
  },
];

export const DEMO_FOLLOW_UPS: FollowUpDraft[] = [
  {
    id: "demo-followup-1",
    leadId: DEMO_LEAD_ID,
    companyName: DEMO_LEAD.companyName,
    contactName: DEMO_LEAD.contactName,
    channel: "email",
    subject: "Acme HVAC — business audit agenda",
    body: `Hi Jordan,\n\nThanks for walking through the follow-up gaps today. Draft agenda for a short business audit is below — nothing has been sent yet.\n\n1) Current lead intake\n2) Job status handoffs\n3) Where AION should implement first\n\nReply works, or approve send in Follow-Up.\n\n— AION`,
    dueAt: "2026-10-08T16:00:00.000Z",
    recommendation: "Send business audit agenda after approval",
    evidenceState: "draft",
  },
];

export const DEMO_LEARNING_SIGNALS: LearningSignal[] = [
  {
    id: "demo-learn-1",
    interventionId:
      "ivn-objection_reframe-demo-call-1-reframe-tools-objection-implementation-partner",
    title: "Acme HVAC · exploring",
    detail: "Objection reframe on 'already have tools' kept the conversation in audit mode",
    intervention: "Reframe tools objection → implementation partner",
    outcome: "Book business audit",
    stageFrom: "lead",
    stageTo: "business_audit",
    useful: true,
    repUsed: true,
    pattern: "We already have tools",
    occurredAt: "2026-10-06T14:30:00.000Z",
  },
];

export function isDemoOrganization(organizationId: string): boolean {
  return organizationId === DEMO_ORG_ID;
}
