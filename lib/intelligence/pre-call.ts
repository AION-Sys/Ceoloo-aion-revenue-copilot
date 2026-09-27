import { buildQualificationQuestions } from "@/lib/sales/motion";
import type { BusinessContext, Lead } from "@/lib/sales/types";

export type PreCallBrief = {
  lead: Lead;
  context: BusinessContext;
  recommendedQuestions: string[];
};

/**
 * Builds pre-call intelligence from the lead and the AION qualification motion.
 * Questions cover workflow, impact, systems, automation, decision maker,
 * readiness, timeline, commercial fit, and recommended service.
 */
export function buildPreCallBrief(lead: Lead, context: BusinessContext): PreCallBrief {
  return {
    lead,
    context,
    recommendedQuestions: buildQualificationQuestions(lead, context),
  };
}
