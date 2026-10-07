import { getAiGatewayEnv } from "@/lib/ai/env";
import { complete } from "@/lib/ai/gateway";
import { recallGuidanceLessons } from "@/lib/learning/memory/loop";
import type { RecallMemoryResult } from "@/lib/learning/memory/types";
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
  /** Lessons recalled from the self-learning memory loop. */
  learningLessons?: RecallMemoryResult;
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

  const learningLessons = await recallGuidanceLessons({
    companyName: input.lead.companyName,
    objection: input.objection,
    workflowProblem: input.context.workflowProblems[0],
    organizationId: input.lead.organizationId,
  });

  let objectionReframe = guidance.objectionReframe;
  if (input.objection?.trim() && getAiGatewayEnv().ok) {
    try {
      const aiReframe = await generateObjectionReframeWithAi(input);
      if (aiReframe) {
        objectionReframe = aiReframe;
      }
    } catch {
      // Fall back to rule-based reframe from buildDuringCallGuidance.
    }
  }

  if (learningLessons.hits.length > 0) {
    const top = learningLessons.hits[0]!;
    const lessonLine = `Learned (${learningLessons.adapterId}/${top.kind ?? "memory"}): ${top.text}`;
    objectionReframe = objectionReframe ? `${objectionReframe} ${lessonLine}` : lessonLine;
  }

  return {
    ...guidance,
    objectionReframe,
    learningLessons,
  };
}
