import { getAiGatewayEnv } from "@/lib/ai/env";
import { complete } from "@/lib/ai/gateway";
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
};

const DEFAULT_OBJECTION_REFRAMES: Record<string, string> = {
  price: "Totally fair — let's compare the cost of slow follow-up versus what one extra closed job covers.",
  timing: "Makes sense. What would need to be true for this to become a priority this month?",
  trust: "Understood. Would a short pilot on one crew or one lead source help you evaluate without a big commitment?",
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
  return `Acknowledge the concern about "${objection.trim()}", then ask what would need to change for this to become a priority.`;
}

export function buildDuringCallGuidance(input: DuringCallGuidanceInput): DuringCallGuidance {
  const { lead, context, repNotes, objection } = input;
  const notes = repNotes?.trim();

  const checklist = [
    "Confirm decision-maker and timeline",
    "Validate top operational pain",
    "Quantify impact of the pain (leads, revenue, time)",
    "Confirm fit for the relevant offer",
    "Agree on a concrete next step before ending the call",
  ];

  const scriptCue = notes
    ? `Based on what you've heard (${notes.slice(0, 120)}${notes.length > 120 ? "…" : ""}), summarize their situation and ask what success looks like in the next 30 days.`
    : `Open with context on ${lead.companyName}'s ${context.industry} operations, then ask which challenge is most urgent right now.`;

  const nextBestQuestion =
    context.likelyPains.length > 0
      ? `When ${context.likelyPains[0]} happens, what does that cost you in a typical week?`
      : "What would need to change for you to feel confident moving forward?";

  const nextBestAction = context.relevantOffer
    ? `Offer a low-friction next step tied to ${context.relevantOffer}.`
    : "Propose a follow-up with a concrete agenda and owner on both sides.";

  return {
    scriptCue,
    checklist,
    objectionReframe: objection ? matchObjectionReframe(objection) : undefined,
    nextBestQuestion,
    nextBestAction,
    qualificationPrompt:
      "Capture qualification as: unqualified, exploring, qualified, or disqualified — plus why.",
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
        content:
          "You are a sales coach for home-service contractors. Reply with one concise objection reframe (2 sentences max).",
      },
      {
        role: "user",
        content: `Company: ${input.lead.companyName}\nObjection: ${input.objection}\nContext: ${input.context.likelyPains.join(", ") || "general SMB sales"}`,
      },
    ],
  });

  return content.trim() || undefined;
}

export async function generateDuringCallGuidance(
  input: DuringCallGuidanceInput,
): Promise<DuringCallGuidance> {
  const guidance = buildDuringCallGuidance(input);

  if (!input.objection?.trim() || !getAiGatewayEnv().ok) {
    return guidance;
  }

  try {
    const objectionReframe = await generateObjectionReframeWithAi(input);
    if (objectionReframe) {
      return { ...guidance, objectionReframe };
    }
  } catch {
    // Fall back to rule-based reframe from buildDuringCallGuidance.
  }

  return guidance;
}
