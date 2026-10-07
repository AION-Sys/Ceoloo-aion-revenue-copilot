import { getAiGatewayEnv } from "@/lib/ai/env";
import { complete } from "@/lib/ai/gateway";
import {
  decideNextBestAction,
  decideObjectionHandling,
} from "@/lib/decisions/sales-decisions";
import type { DecisionResult } from "@/lib/decisions/types";
import {
  buildAgentSystemPrompt,
  discoveryChecklist,
  nextActionForStage,
} from "@/lib/sales/motion";
import type { BusinessContext, Lead } from "@/lib/sales/types";

export type DuringCallGuidanceInput = {
  lead: Lead;
  context: BusinessContext;
  repNotes?: string;
  objection?: string;
};

export type DuringCallGuidance = {
  scriptCue: string;
  checklist: string[];
  objectionReframe?: string;
  nextBestQuestion: string;
  nextBestAction: string;
  qualificationPrompt: string;
  /** Discrete adapter score for next-best action (provider-switched). */
  nextBestActionDecision?: DecisionResult;
  /** Discrete adapter score for objection handling (provider-switched). */
  objectionDecision?: DecisionResult;
  /** Which decision connector produced discrete scores. */
  decisionAdapterId?: DecisionResult["adapterId"];
};

const DEFAULT_OBJECTION_REFRAMES: Record<string, string> = {
  price:
    "Fair concern. Compare the cost of the manual workflow with the implementation, and check whether the commercial fit is real.",
  timing:
    "Understood. What would need to be true for this workflow change to become a priority on the current timeline?",
  trust:
    "That makes sense. A bounded business audit can diagnose the workflow before any implementation commitment.",
};

function matchObjectionReframe(objection: string): string | undefined {
  const normalized = objection.toLowerCase();
  if (normalized.includes("price") || normalized.includes("expensive") || normalized.includes("budget")) {
    return DEFAULT_OBJECTION_REFRAMES.price;
  }
  if (normalized.includes("timing") || normalized.includes("later") || normalized.includes("busy")) {
    return DEFAULT_OBJECTION_REFRAMES.timing;
  }
  if (normalized.includes("trust") || normalized.includes("not sure") || normalized.includes("skeptic")) {
    return DEFAULT_OBJECTION_REFRAMES.trust;
  }
  return `Acknowledge the concern about "${objection.trim()}", then ask what would need to change for implementation to become a priority.`;
}

export function buildDuringCallGuidance(input: DuringCallGuidanceInput): DuringCallGuidance {
  const { lead, context, repNotes, objection } = input;
  const notes = repNotes?.trim();
  const checklist = discoveryChecklist();

  const scriptCue = notes
    ? `Based on what you've heard (${notes.slice(0, 120)}${notes.length > 120 ? "…" : ""}), reflect the workflow problem and ask which funnel step comes next: audit, diagnosis, scope, or proposal.`
    : `Open the business audit for ${lead.companyName}. Ask how work runs in their ${context.industry} operation, then which workflow problem is most expensive.`;

  const nextBestQuestion =
    context.workflowProblems.length > 0
      ? `When ${context.workflowProblems[0]} happens, what does that cost the business in a typical week?`
      : "Which part of the current workflow should an implementation change first?";

  const nextBestAction = context.recommendedService
    ? `Propose the next funnel step for ${context.recommendedService}: audit, diagnosis, implementation scope, or proposal.`
    : nextActionForStage(lead.status);

  return {
    scriptCue,
    checklist,
    objectionReframe: objection ? matchObjectionReframe(objection) : undefined,
    nextBestQuestion,
    nextBestAction,
    qualificationPrompt:
      "Qualify on current workflow, business impact, existing systems, automation opportunity, decision maker, implementation readiness, urgency/timeline, budget/commercial fit, and recommended AION service. Then mark unqualified, exploring, qualified, or disqualified.",
  };
}

async function generateObjectionReframeWithAi(
  input: DuringCallGuidanceInput,
): Promise<string | undefined> {
  if (!input.objection?.trim()) {
    return undefined;
  }

  const { content } = await complete({
    messages: [
      {
        role: "system",
        content: buildAgentSystemPrompt(),
      },
      {
        role: "user",
        content: [
          `Company: ${input.lead.companyName}`,
          `Industry: ${input.context.industry}`,
          `Workflow problems: ${input.context.workflowProblems.join(", ") || "not yet captured"}`,
          `Existing systems: ${input.context.existingSystems.join(", ") || "not yet captured"}`,
          `Recommended AION service: ${input.context.recommendedService ?? "not yet recommended"}`,
          `Objection: ${input.objection}`,
        ].join("\n"),
      },
    ],
  });

  return content.trim() || undefined;
}

export async function generateDuringCallGuidance(
  input: DuringCallGuidanceInput,
): Promise<DuringCallGuidance> {
  const guidance = buildDuringCallGuidance(input);

  const nextBestActionDecision = await decideNextBestAction({
    lead: input.lead,
    context: input.context,
    objections: input.objection ? [input.objection] : undefined,
    repNotes: input.repNotes,
  });

  const selectedAction = nextBestActionDecision.options.find(
    (o) => o.id === nextBestActionDecision.selectedOptionId,
  );

  let objectionDecision: DecisionResult | undefined;
  let objectionReframe = guidance.objectionReframe;

  if (input.objection?.trim()) {
    objectionDecision = await decideObjectionHandling({
      lead: input.lead,
      context: input.context,
      objection: input.objection,
      repNotes: input.repNotes,
    });

    const strategy = objectionDecision.options.find(
      (o) => o.id === objectionDecision!.selectedOptionId,
    );
    const strategyLine = strategy
      ? `Strategy (${objectionDecision.adapterId}): ${strategy.label}.`
      : undefined;

    if (getAiGatewayEnv().ok) {
      try {
        const aiReframe = await generateObjectionReframeWithAi(input);
        if (aiReframe) {
          objectionReframe = strategyLine ? `${strategyLine} ${aiReframe}` : aiReframe;
        } else if (strategyLine) {
          objectionReframe = `${strategyLine} ${objectionReframe ?? ""}`.trim();
        }
      } catch {
        if (strategyLine) {
          objectionReframe = `${strategyLine} ${objectionReframe ?? ""}`.trim();
        }
      }
    } else if (strategyLine) {
      objectionReframe = `${strategyLine} ${objectionReframe ?? ""}`.trim();
    }
  }

  return {
    ...guidance,
    nextBestAction: selectedAction?.label ?? guidance.nextBestAction,
    objectionReframe,
    nextBestActionDecision,
    objectionDecision,
    decisionAdapterId: nextBestActionDecision.adapterId,
  };
}
