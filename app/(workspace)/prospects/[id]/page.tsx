import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EvidenceStateBadge } from "@/components/cockpit/EvidenceStateBadge";
import { LineageTrail } from "@/components/cockpit/LineageTrail";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getRepSession } from "@/lib/auth/session";
import {
  DEMO_QUALIFICATION_PROFILE,
  isDemoOrganization,
} from "@/lib/cockpit/demo";
import { buildProspectWorkspace } from "@/lib/cockpit/prospect";
import { getOrCreateDemoCallForLead } from "@/lib/demo/fixtures";
import { getPreCallBriefForLead } from "@/lib/intelligence/brief";
import { funnelStageLabel } from "@/lib/sales/motion";

type ProspectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProspectWorkspacePage({ params }: ProspectPageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/dashboard");
  }

  const { id } = await params;
  const result = await getPreCallBriefForLead(id, repSession.organizationId);
  if (!result.ok) {
    notFound();
  }

  const { lead, context } = result.brief;
  const demo = isDemoOrganization(lead.organizationId);
  const demoCall = getOrCreateDemoCallForLead(lead.id);
  const calls = demoCall ? [demoCall] : [];

  const workspace = buildProspectWorkspace({
    lead,
    profile: demo ? DEMO_QUALIFICATION_PROFILE : undefined,
    calls,
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/prospects" className="hover:text-foreground">
              Prospects
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">
              {lead.contactName ?? lead.companyName}
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {lead.contactName ?? "Unknown contact"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lead.companyName} · {funnelStageLabel(lead.status)}
            {lead.source ? ` · ${lead.source}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/prospects/${lead.id}/prep`}>Call prep</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/follow-up">Follow-up</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Qualification completeness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {workspace.qualification.filled}/{workspace.qualification.total} fields
                </span>
                <span className="font-medium">{workspace.qualification.percent}%</span>
              </div>
              <Progress value={workspace.qualification.percent} />
              {workspace.qualification.gaps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {workspace.qualification.gaps.map((gap) => (
                    <Badge key={gap.id} variant="outline">
                      Missing: {gap.label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  All qualification dimensions filled.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business context</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p>{context.industry}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recommended service</p>
                <p>{context.recommendedService ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Systems</p>
                <p>{context.existingSystems.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Known pains</p>
                <p>{context.workflowProblems.join(", ") || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interaction history</CardTitle>
            </CardHeader>
            <CardContent>
              {workspace.history.length === 0 ? (
                <EmptyState
                  title="No history yet"
                  description="Prep opens, calls, outcomes, and follow-up drafts will land here."
                />
              ) : (
                <ul className="space-y-3">
                  {workspace.history.map((event) => (
                    <li key={event.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.evidenceState ? (
                          <EvidenceStateBadge state={event.evidenceState} />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
                      {event.occurredAt !== "1970-01-01T00:00:00.000Z" ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {new Date(event.occurredAt).toLocaleString()}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <LineageTrail trail={workspace.lineage} />

          <Card>
            <CardHeader>
              <CardTitle>CRM drafts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workspace.proposedCrmChanges.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No CRM proposals. Post-call review creates reviewable drafts only.
                </p>
              ) : (
                workspace.proposedCrmChanges.map((change) => (
                  <div key={change.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{change.field}</p>
                      <EvidenceStateBadge state={change.evidenceState} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {change.fromValue} → {change.toValue}
                    </p>
                  </div>
                ))
              )}
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/follow-up">Open Follow-Up workspace</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
