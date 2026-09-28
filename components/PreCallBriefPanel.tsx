import { startCallForLead } from "@/lib/leads/actions";
import { funnelStageLabel } from "@/lib/sales/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PreCallBrief } from "@/lib/intelligence/pre-call";

type PreCallBriefPanelProps = {
  brief: PreCallBrief;
};

export function PreCallBriefPanel({ brief }: PreCallBriefPanelProps) {
  const { lead, context, recommendedQuestions } = brief;

  return (
    <section className="space-y-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pre-call brief
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
            {recommendedQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <form action={startCallForLead.bind(null, lead.id)}>
        <Button type="submit">Start call</Button>
      </form>
    </section>
  );
}
