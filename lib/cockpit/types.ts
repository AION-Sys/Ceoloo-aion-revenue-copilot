import type {
  FunnelStage,
  QualificationProfile,
  QualificationState,
} from "@/lib/sales/types";

/** Evidence states for any CRM or message action. */
export type ActionEvidenceState = "draft" | "approved" | "confirmed" | "rejected";

export type InteractionKind =
  | "lead_created"
  | "prep_opened"
  | "call_started"
  | "call_completed"
  | "follow_up_drafted"
  | "crm_proposed"
  | "crm_confirmed"
  | "note";

export type InteractionEvent = {
  id: string;
  leadId: string;
  kind: InteractionKind;
  title: string;
  detail: string;
  occurredAt: string;
  evidenceState?: ActionEvidenceState;
};

export type QualificationGap = {
  id: string;
  label: string;
  profileKey: keyof QualificationProfile;
};

export type QualificationCompleteness = {
  filled: number;
  total: number;
  percent: number;
  gaps: QualificationGap[];
  filledKeys: Array<keyof QualificationProfile>;
};

export type LineageStepStatus = "pending" | "active" | "done" | "blocked";

export type LineageStep = {
  id: string;
  label: string;
  detail: string;
  status: LineageStepStatus;
};

export type LineageTrail = {
  leadId: string;
  steps: LineageStep[];
};

export type FollowUpDraft = {
  id: string;
  leadId: string;
  companyName: string;
  contactName?: string;
  channel: "email" | "sms" | "task";
  subject: string;
  body: string;
  dueAt: string;
  recommendation: string;
  evidenceState: ActionEvidenceState;
  /** Only set when externally confirmed — never invent a send. */
  externalConfirmationId?: string;
};

export type CrmChangeProposal = {
  id: string;
  leadId: string;
  field: string;
  fromValue: string;
  toValue: string;
  reason: string;
  evidenceState: ActionEvidenceState;
  externalConfirmationId?: string;
};

export type LearningSignal = {
  id: string;
  title: string;
  detail: string;
  intervention: string;
  outcome: string;
  stageFrom?: FunnelStage;
  stageTo?: FunnelStage;
  useful: boolean | null;
  occurredAt: string;
};

export type BuyingSignal = {
  id: string;
  text: string;
  strength: "weak" | "moderate" | "strong";
  source: "rep_capture" | "ai_suggestion";
};

export type Commitment = {
  id: string;
  text: string;
  owner: "rep" | "prospect";
  dueLabel?: string;
};

export type TranscriptCaptureLine = {
  id: string;
  speaker: "Rep" | "Prospect";
  text: string;
  /** Always rep-entered or demo fixture — never claim live STT unless wired. */
  captureMode: "rep_entered" | "demo_fixture";
};

export type CallPrepSurface = {
  objective: string;
  missingInformation: string[];
  likelyObjections: string[];
  positioning: string;
  recommendedQuestions: string[];
};

export type ProspectWorkspaceModel = {
  qualification: QualificationCompleteness;
  history: InteractionEvent[];
  lineage: LineageTrail;
  proposedCrmChanges: CrmChangeProposal[];
  followUps: FollowUpDraft[];
  latestQualification?: QualificationState;
};
