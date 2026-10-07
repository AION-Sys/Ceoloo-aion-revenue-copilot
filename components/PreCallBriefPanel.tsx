import { startCallForLead } from "@/lib/leads/actions";
import { buildCallPrepSurface } from "@/lib/cockpit/prep";
import { scoreQualificationCompleteness } from "@/lib/cockpit/qualification";
import { funnelStageLabel } from "@/lib/sales/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PreCallBrief } from "@/lib/intelligence/pre-call";
import type { QualificationProfile } from "@/lib/sales/types";

type PreCallBriefPanelProps = {
  brief: PreCallBrief;
  profile?: QualificationProfile;
};

export function PreCallBriefPanel({ brief, profile }: PreCallBriefPanelProps) {
  const { lead, context } = brief;
  const prep = buildCallPrepSurface({ lead, context, profile });
  const completeness = scoreQualificationCompleteness(profile);

  return (
    <section className="space-y-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Call prep
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {lead.companyName}
        </h1>
        {lead.contactName ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Contact: {lead.contactName}
          </p>
        ) : null}
      </header>

      <Card className="border-ai/20">
        <CardHeader>
          <CardTitle>Conversation objective</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{prep.objective}</p>
          <p className="mt-3 text-xs text-muted-foreground">{prep.positioning}</p>
          {prep.policy ? (
            <p
              className="mt-3 rounded-md border border-border/80 bg-muted/30 px-2.5 py-2 text-xs leading-snug"
              aria-live="polite"
            >
              <span className="font-semibold">
                {prep.policy.allowPitch ? "Pitch allowed" : "Do not pitch"}
              </span>
              {" · "}
              {prep.engineConfirmed}/{prep.engineTotal} flags confirmed. {prep.policy.rationale}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Lead intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Stage: {funnelStageLabel(lead.status)}</li>
              {lead.source ? <li>Source: {lead.source}</li> : null}
              <li>Industry: {context.industry}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Likely objections</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {prep.likelyObjections.map((objection) => (
                <li key={objection}>{objection}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qualification gaps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Completeness</span>
              <span className="font-medium">{completeness.percent}%</span>
            </div>
            <Progress value={completeness.percent} />
            {prep.missingInformation.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {prep.missingInformation.slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Qualification profile looks complete.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workflow problems</CardTitle>
          </CardHeader>
          <CardContent>
            {context.workflowProblems.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {context.workflowProblems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No workflow problems recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended AION service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {context.recommendedService ?? "No AION service recommended yet."}
            </p>
            {context.existingSystems.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Systems: {context.existingSystems.join(", ")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended questions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1 pl-4 text-sm">
            {prep.recommendedQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <form action={startCallForLead.bind(null, lead.id)}>
        <Button type="submit">Start live call</Button>
      </form>
    </section>
  );
}
