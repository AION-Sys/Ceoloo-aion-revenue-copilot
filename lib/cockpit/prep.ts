import { scoreQualificationCompleteness } from "@/lib/cockpit/qualification";
import type { CallPrepSurface } from "@/lib/cockpit/types";
import { buildQualificationQuestions, funnelStageLabel } from "@/lib/sales/motion";
import { buildQualificationEngine } from "@/lib/sales/qualification-engine";
import type { BusinessContext, Lead, QualificationProfile } from "@/lib/sales/types";

export function buildCallPrepSurface(input: {
  lead: Lead;
  context: BusinessContext;
  profile?: QualificationProfile;
}): CallPrepSurface {
  const completeness = scoreQualificationCompleteness(input.profile);
  const { state, policy } = buildQualificationEngine({
    lead: input.lead,
    context: input.context,
    profile: input.profile,
  });
  const stage = funnelStageLabel(input.lead.status);
  const topPain = input.context.workflowProblems[0];
  const service =
    input.context.recommendedService ?? "an AION workflow implementation engagement";

  const objective = policy.allowPitch
    ? topPain
      ? `Advance ${input.lead.companyName}: confirm fit for ${service} and lock the next step (${state.confirmed}/${state.total} confirmed).`
      : `Advance ${input.lead.companyName} with a clear next step for ${service}.`
    : topPain
      ? `Stay in discovery on ${topPain}. ${policy.primaryMove}`
      : `Qualify ${input.lead.companyName} for ${service} without pitching early. ${policy.primaryMove}`;

  const missingInformation = completeness.gaps.map((gap) => gap.label);
  if (!input.lead.contactName) {
    missingInformation.unshift("Decision-maker / primary contact name");
  }

  const likelyObjections = [
    "We're too busy to change workflows right now",
    "We already have tools — not sure we need another system",
    "Need to talk to a partner / spouse / ops lead before deciding",
  ];
  if (input.context.existingSystems.length > 0) {
    likelyObjections.unshift(
      `We already run on ${input.context.existingSystems.slice(0, 2).join(" and ")}`,
    );
  }

  const positioning = policy.allowPitch
    ? `Discovery threshold met (${state.confirmed}/${state.total}). Position AION as the implementation partner for ${service} — still confirm commitments before claiming a close.`
    : topPain
      ? `Do not pitch yet (${state.confirmed}/${state.total} confirmed). Position AION as the partner that closes the ${topPain} leak after impact is owned. Stay in the ${stage} conversation.`
      : `Do not pitch yet (${state.confirmed}/${state.total} confirmed). Stay focused on the ${stage} objective until discovery clears ${policy.focusFlagId ?? "impact"}.`;

  const allQuestions = buildQualificationQuestions(input.lead, input.context);
  const prioritized = [
    policy.primaryQuestion,
    ...allQuestions.filter((q) => q !== policy.primaryQuestion),
  ];

  return {
    objective,
    missingInformation,
    likelyObjections: likelyObjections.slice(0, 4),
    positioning,
    recommendedQuestions: prioritized,
    policy,
    engineConfirmed: state.confirmed,
    engineTotal: state.total,
  };
}
