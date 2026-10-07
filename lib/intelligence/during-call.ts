import { getAiGatewayEnv } from "@/lib/ai/env";
import { complete } from "@/lib/ai/gateway";
import {
  decideNextBestAction,
  decideObjectionHandling,
} from "@/lib/decisions/sales-decisions";
import type { DecisionResult } from "@/lib/decisions/types";
import { recallGuidanceLessons } from "@/lib/learning/memory/loop";
import type { RecallMemoryResult } from "@/lib/learning/memory/types";
import {
  buildAgentSystemPrompt,
  discoveryChecklist,
  nextActionForStage,
} from "@/lib/sales/motion";
import {
  buildQualificationEngine,
  type CopilotPolicy,
  type QualificationEngineState,
} from "@/lib/sales/qualification-engine";
import type { BusinessContext, Lead, QualificationProfile } from "@/lib/sales/types";

export type DuringCallGuidanceInput = {
  lead: Lead;
  context: BusinessContext;
  repNotes?: string;
  objection?: string;
  profile?: QualificationProfile | null;
  nextAction?: string;
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
  /** Lessons recalled from the self-learning memory loop. */
  learningLessons?: RecallMemoryResult;
  /** Structured qualification state + Copilot policy. */
  qualificationState?: QualificationEngineState;
  copilotPolicy?: CopilotPolicy;
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
  const { state, policy } = buildQualificationEngine({
    lead,
    context,
    profile: input.profile,
    evidence: { nextAction: input.nextAction },
  });

  const scriptCue = policy.allowPitch
    ? notes
      ? `Based on what you've heard (${notes.slice(0, 120)}${notes.length > 120 ? "…" : ""}), lock the next funnel step — discovery threshold is met (${state.confirmed}/${state.total}).`
      : `Discovery looks complete enough (${state.confirmed}/${state.total}). Confirm service fit and commit the next step for ${lead.companyName}.`
    : notes
      ? `Based on what you've heard (${notes.slice(0, 120)}${notes.length > 120 ? "…" : ""}), stay in discovery — do not pitch yet (${state.confirmed}/${state.total}).`
      : `Open the business audit for ${lead.companyName}. Do not pitch yet (${state.confirmed}/${state.total}). Ask how work runs in their ${context.industry} operation, then quantify the most expensive workflow problem.`;

  const nextBestQuestion = policy.primaryQuestion;

  const nextBestAction = policy.allowPitch
    ? policy.primaryMove
    : policy.primaryMove ||
      (context.recommendedService
        ? `Stay in discovery before proposing ${context.recommendedService}.`
        : nextActionForStage(lead.status));

  return {
    scriptCue,
    checklist,
    objectionReframe: objection ? matchObjectionReframe(objection) : undefined,
    nextBestQuestion,
    nextBestAction,
    qualificationPrompt:
      "Qualify on current workflow, business impact, existing systems, automation opportunity, decision maker, implementation readiness, urgency/timeline, budget/commercial fit, and recommended AION service. Then mark unqualified, exploring, qualified, or disqualified.",
    qualificationState: state,
    copilotPolicy: policy,
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

  const [nextBestActionDecision, learningLessons] = await Promise.all([
    decideNextBestAction({
      lead: input.lead,
      context: input.context,
      objections: input.objection ? [input.objection] : undefined,
      repNotes: input.repNotes,
    }),
    recallGuidanceLessons({
      companyName: input.lead.companyName,
      objection: input.objection,
      workflowProblem: input.context.workflowProblems[0],
      organizationId: input.lead.organizationId,
    }),
  ]);

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

  if (learningLessons.hits.length > 0) {
    const top = learningLessons.hits[0]!;
    const lessonLine = `Learned (${learningLessons.adapterId}/${top.kind ?? "memory"}): ${top.text}`;
    objectionReframe = objectionReframe ? `${objectionReframe} ${lessonLine}` : lessonLine;
  }

  // Qualification policy owns the live next-best action string when discovery
  // is incomplete; decision adapters stay attached as scored metadata.
  const nextBestAction =
    guidance.copilotPolicy && !guidance.copilotPolicy.allowPitch
      ? guidance.nextBestAction
      : (selectedAction?.label ?? guidance.nextBestAction);

  return {
    ...guidance,
    nextBestAction,
    objectionReframe,
    nextBestActionDecision,
    objectionDecision,
    decisionAdapterId: nextBestActionDecision.adapterId,
    learningLessons,
  };
}
