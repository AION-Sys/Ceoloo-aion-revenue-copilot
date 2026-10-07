import {
  DEMO_CRM_PROPOSALS,
  DEMO_FOLLOW_UPS,
  DEMO_INTERACTIONS,
  DEMO_QUALIFICATION_PROFILE,
  isDemoOrganization,
} from "@/lib/cockpit/demo";
import { buildInteractionHistory } from "@/lib/cockpit/history";
import { buildLineageTrail } from "@/lib/cockpit/lineage";
import { scoreQualificationCompleteness } from "@/lib/cockpit/qualification";
import type { ProspectWorkspaceModel } from "@/lib/cockpit/types";
import type { Call } from "@/lib/calls/mappers";
import type { CallOutcome, Lead, QualificationProfile } from "@/lib/sales/types";

export function buildProspectWorkspace(input: {
  lead: Lead;
  profile?: QualificationProfile;
  calls?: Call[];
  outcomes?: CallOutcome[];
}): ProspectWorkspaceModel {
  const demo = isDemoOrganization(input.lead.organizationId);
  const profile =
    input.profile ?? (demo ? DEMO_QUALIFICATION_PROFILE : undefined);
  const qualification = scoreQualificationCompleteness(profile);
  const history = buildInteractionHistory({
    lead: input.lead,
    calls: input.calls,
    outcomes: input.outcomes,
    extra: demo ? DEMO_INTERACTIONS : [],
  });

  const latestOutcome = input.outcomes?.[0];
  const proposedCrmChanges = demo ? DEMO_CRM_PROPOSALS : [];
  const followUps = demo ? DEMO_FOLLOW_UPS : [];

  const lineage = buildLineageTrail({
    leadId: input.lead.id,
    hasConversation: (input.calls?.length ?? 0) > 0 || demo,
    hasEvidence:
      Boolean(latestOutcome?.painPoints.length) ||
      qualification.filled > 0 ||
      demo,
    recommendation:
      latestOutcome?.nextAction ||
      followUps[0]?.recommendation ||
      (demo ? "Open call prep, then run discovery" : undefined),
    repDecision: proposedCrmChanges.some((c) => c.evidenceState !== "draft")
      ? "Rep reviewed proposed CRM updates"
      : demo
        ? "Awaiting rep approval on CRM drafts"
        : undefined,
    crmProposal: proposedCrmChanges[0] ?? null,
    outcome: latestOutcome ?? null,
  });

  return {
    qualification,
    history,
    lineage,
    proposedCrmChanges,
    followUps,
    latestQualification: latestOutcome?.qualification,
  };
}
