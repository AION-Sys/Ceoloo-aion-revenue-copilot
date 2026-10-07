import { DEMO_ORG_ID } from "@/lib/auth/demo";
import {
  organizationLearningBankId,
  retainMistakeLearning,
  retainPracticeLearning,
  retainTestRunLearning,
} from "@/lib/learning/memory";
import { listLocalEpisodes } from "@/lib/learning/memory/store";

/**
 * Seeds a small local learning bank for demo orgs so the Learning screen
 * can show retain→recall→reflect without a live Hindsight server.
 */
export async function ensureDemoLearningMemory(organizationId: string = DEMO_ORG_ID): Promise<void> {
  const bankId = organizationLearningBankId(organizationId);
  if (listLocalEpisodes(bankId).length > 0) {
    return;
  }

  await retainPracticeLearning(
    {
      title: "Quantify follow-up leak before pitching",
      detail:
        "When prospects say they already have tools, ask what happens to leads after hours — then size the weekly cost before naming AION services.",
      source: "demo seed",
      seed: "demo-practice-quantify",
      occurredAt: "2026-10-05T12:00:00.000Z",
    },
    { bankId, adapterId: "local", organizationId },
  );

  await retainMistakeLearning(
    {
      title: "Pitching automation before impact",
      detail:
        "Jumping to workflow automation before confirming business impact produced polite stalls. Fix: stay in business audit until impact is owned.",
      source: "demo seed",
      seed: "demo-mistake-early-pitch",
      occurredAt: "2026-10-04T16:00:00.000Z",
    },
    { bankId, adapterId: "local", organizationId },
  );

  await retainTestRunLearning(
    {
      suite: "critical-path/post-call-pipeline",
      passed: true,
      summary: "Outcome → CRM persist → learning ingest path green in unit suite.",
      occurredAt: "2026-10-06T09:00:00.000Z",
    },
    { bankId, adapterId: "local", organizationId },
  );
}
