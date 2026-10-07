import { scoreQualificationCompleteness } from "@/lib/cockpit/qualification";
import type { CallPrepSurface } from "@/lib/cockpit/types";
import { buildQualificationQuestions, funnelStageLabel } from "@/lib/sales/motion";
import type { BusinessContext, Lead, QualificationProfile } from "@/lib/sales/types";

export function buildCallPrepSurface(input: {
  lead: Lead;
  context: BusinessContext;
  profile?: QualificationProfile;
}): CallPrepSurface {
  const completeness = scoreQualificationCompleteness(input.profile);
  const stage = funnelStageLabel(input.lead.status);
  const topPain = input.context.workflowProblems[0];
  const service =
    input.context.recommendedService ?? "an AION workflow implementation engagement";

  const objective = topPain
    ? `Confirm whether ${topPain} is the primary leak and whether ${input.lead.companyName} is ready for ${service}.`
    : `Qualify ${input.lead.companyName} for ${service} and leave with a clear next step.`;

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

  const positioning = topPain
    ? `Position AION as the implementation partner that closes the ${topPain} leak — not another generic AI chat tool. Stay in the ${stage} conversation.`
    : `Position AION as a governed implementation partner for revenue ops — stay focused on the ${stage} objective.`;

  return {
    objective,
    missingInformation,
    likelyObjections: likelyObjections.slice(0, 4),
    positioning,
    recommendedQuestions: buildQualificationQuestions(input.lead, input.context),
  };
}
