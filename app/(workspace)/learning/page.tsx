import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepSession } from "@/lib/auth/session";
import { DEMO_LEARNING_SIGNALS, isDemoOrganization } from "@/lib/cockpit/demo";
import { funnelStageLabel } from "@/lib/sales/motion";

export default async function LearningPage() {
  const repSession = await getRepSession();
  if (!repSession) return null;

  const signals = isDemoOrganization(repSession.organizationId)
    ? DEMO_LEARNING_SIGNALS
    : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Learning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Interventions, outcomes, and stage movement — what actually moved opportunities.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard">Back to Today</Link>
        </Button>
      </div>

      {signals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Learning signals appear after real call outcomes are captured. No fabricated ROI.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
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
              <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Intervention</p>
                  <p>{signal.intervention}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outcome</p>
                  <p>{signal.outcome}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stage movement</p>
                  <p>
                    {signal.stageFrom ? funnelStageLabel(signal.stageFrom) : "—"}
                    {" → "}
                    {signal.stageTo ? funnelStageLabel(signal.stageTo) : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
