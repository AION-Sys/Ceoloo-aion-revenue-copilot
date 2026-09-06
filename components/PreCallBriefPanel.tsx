import { startCallForLead } from "@/lib/leads/actions";
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
              <li>Status: {lead.status ?? "new"}</li>
              {lead.source ? <li>Source: {lead.source}</li> : null}
              <li>Industry: {context.industry}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Likely pains</CardTitle>
          </CardHeader>
          <CardContent>
            {context.likelyPains.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {context.likelyPains.map((pain) => (
                  <li key={pain}>{pain}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No pains recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relevant offer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {context.relevantOffer ?? "No offer configured for this context."}
            </p>
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
