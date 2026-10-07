import Link from "next/link";
import { InterventionFeedback } from "@/components/cockpit/InterventionFeedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepSession } from "@/lib/auth/session";
import { DEMO_LEARNING_SIGNALS, isDemoOrganization } from "@/lib/cockpit/demo";
import {
  applyInterventionFeedback,
  createIntervention,
  interventionToLearningSignal,
  listInterventions,
  upsertIntervention,
} from "@/lib/learning/interventions";
import {
  ensureDemoLearningMemory,
  getLearningMemoryAdapterId,
  listLocalEpisodes,
  organizationLearningBankId,
  reflectSalesLearning,
} from "@/lib/learning/memory";
import { funnelStageLabel } from "@/lib/sales/motion";

export default async function LearningPage() {
  const repSession = await getRepSession();
  if (!repSession) return null;

  const isDemo = isDemoOrganization(repSession.organizationId);
  const adapterId = getLearningMemoryAdapterId();
  const bankId = organizationLearningBankId(repSession.organizationId);

  if (isDemo) {
    await ensureDemoLearningMemory(repSession.organizationId);
    // Seed demo intervention into the store so usefulness capture can resolve ids.
    for (const signal of DEMO_LEARNING_SIGNALS) {
      if (!signal.interventionId) continue;
      const seeded = createIntervention({
        interventionId: signal.interventionId,
        kind: "objection_reframe",
        recommendation: signal.intervention,
        pattern: signal.pattern,
        organizationId: repSession.organizationId,
        stageBefore: signal.stageFrom,
        occurredAt: signal.occurredAt,
      });
      upsertIntervention(
        applyInterventionFeedback(seeded, {
          useful: signal.useful,
          repUsed: signal.repUsed ?? null,
          stageAfter: signal.stageTo,
          eventualOutcome: signal.outcome,
        }),
      );
    }
  }

  const stored = listInterventions({ organizationId: repSession.organizationId });
  const signals = [
    ...stored.map((record) => interventionToLearningSignal(record)),
    ...(isDemo ? DEMO_LEARNING_SIGNALS : []),
  ].filter(
    (signal, index, all) =>
      all.findIndex((item) => (item.interventionId ?? item.id) === (signal.interventionId ?? signal.id)) ===
      index,
  );

  const reflection = await reflectSalesLearning(
    {
      question:
        "What practices should the rep repeat, and which mistakes should they avoid on the next discovery call?",
      context: "Revenue Copilot Learning screen",
      organizationId: repSession.organizationId,
    },
    { adapterId: adapterId === "hindsight" ? "hindsight" : "local", bankId },
  );

  const episodes = listLocalEpisodes(bankId).slice().reverse().slice(0, 8);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Learning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Measurable interventions — stable ids, usefulness capture, stage lineage. No
            fabricated ROI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">memory: {adapterId}</Badge>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">Back to Today</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reflect</CardTitle>
          <p className="text-sm text-muted-foreground">
            Disposition over retained episodes ({reflection.adapterId}).
          </p>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {reflection.text}
          </pre>
        </CardContent>
      </Card>

      {episodes.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Retained episodes ({bankId})
          </h2>
          {episodes.map((episode) => (
            <Card key={episode.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">{episode.kind}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{episode.content}</p>
                </div>
                <Badge
                  variant={
                    episode.valence === "positive"
                      ? "success"
                      : episode.valence === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {episode.valence}
                </Badge>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : null}

      {signals.length === 0 && episodes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Learning signals appear after real call outcomes, test runs, mistakes, and practices
            are retained. No fabricated ROI.
          </CardContent>
        </Card>
      ) : signals.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Outcome signals</h2>
          {signals.map((signal) => (
            <Card key={signal.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">{signal.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{signal.detail}</p>
                </div>
                <Badge
                  variant={
                    signal.useful === true
                      ? "success"
                      : signal.useful === false
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {signal.useful === true
                    ? "Useful"
                    : signal.useful === false
                      ? "Not useful"
                      : "Unreviewed"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Intervention</p>
                    <p>{signal.intervention}</p>
                    {signal.interventionId ? (
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {signal.interventionId}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outcome</p>
                    <p>{signal.outcome}</p>
                    {signal.pattern ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pattern: {signal.pattern}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stage movement</p>
                    <p>
                      {signal.stageFrom ? funnelStageLabel(signal.stageFrom) : "—"}
                      {" → "}
                      {signal.stageTo ? funnelStageLabel(signal.stageTo) : "—"}
                    </p>
                    {signal.repUsed != null ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Rep {signal.repUsed ? "used" : "skipped"}
                      </p>
                    ) : null}
                  </div>
                </div>
                {signal.interventionId ? (
                  <InterventionFeedback
                    interventionId={signal.interventionId}
                    initialUseful={signal.useful}
                    initialRepUsed={signal.repUsed ?? null}
                  />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
