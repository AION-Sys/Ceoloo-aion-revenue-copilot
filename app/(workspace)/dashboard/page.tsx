import Link from "next/link";
import { Phone, UserPlus } from "lucide-react";
import { AIInsightCard } from "@/components/primitives/AIInsightCard";
import { EmptyState } from "@/components/primitives/EmptyState";
import { MetricCard } from "@/components/primitives/MetricCard";
import { PriorityBadge } from "@/components/primitives/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildOverviewDashboard } from "@/lib/dashboard/overview";
import { listLeadsForOrganization } from "@/lib/leads/repository";
import { getRepSession } from "@/lib/auth/session";
import { DEMO_FOLLOW_UPS, isDemoOrganization } from "@/lib/cockpit/demo";
import {
  displayNameFromEmail,
  greetingForHour,
} from "@/lib/utils";

export default async function DashboardPage() {
  const repSession = await getRepSession();
  if (!repSession) {
    return null;
  }

  const leads = await listLeadsForOrganization(repSession.organizationId);
  const overview = buildOverviewDashboard(leads);
  const repName = displayNameFromEmail(repSession.email);
  const greeting = greetingForHour(new Date().getHours());
  const followUps = isDemoOrganization(repSession.organizationId) ? DEMO_FOLLOW_UPS : [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {repName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Command center — priority prospects, follow-ups, and the next governed move.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/calls">
              <Phone className="h-4 w-4" />
              Start Call
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/prospects">
              <UserPlus className="h-4 w-4" />
              Open Prospects
            </Link>
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-2 divide-x divide-y md:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
          {overview.kpis.map((kpi) => (
            <MetricCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="priority">
              <TabsList>
                <TabsTrigger value="priority">Priority</TabsTrigger>
                <TabsTrigger value="followups">Follow-Ups</TabsTrigger>
                <TabsTrigger value="calls">Calls</TabsTrigger>
              </TabsList>
              <TabsContent value="priority" className="mt-4 space-y-0">
                {overview.todayQueue.length === 0 ? (
                  <EmptyState
                    title="Nothing in today’s priority queue"
                    description="Add a prospect to begin Prepare → Call → Capture → Follow Up → Learn."
                    actionLabel="Open Prospects"
                    actionHref="/prospects"
                  />
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {overview.todayQueue.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{item.contactName}</p>
                            <PriorityBadge priority={item.priority} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.companyName}
                          </p>
                          <p className="text-xs">
                            <span className="text-muted-foreground">Stage:</span>{" "}
                            {item.stage}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last interaction: {item.lastInteraction}
                          </p>
                          <p className="text-sm leading-snug">
                            <span className="text-ai">Recommended move:</span>{" "}
                            {item.recommendation}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                          <span className="text-xs text-muted-foreground">
                            {item.dueLabel}
                          </span>
                          <Button asChild size="sm" variant="outline">
                            <Link href={item.href}>Open</Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="followups" className="mt-4">
                {followUps.length === 0 ? (
                  <EmptyState
                    title="No follow-ups queued"
                    description="Post-call drafts appear here after review — still drafts until confirmed."
                    actionLabel="Open Follow-Up"
                    actionHref="/follow-up"
                  />
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {followUps.map((draft) => (
                      <li
                        key={draft.id}
                        className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{draft.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {draft.companyName} · {draft.evidenceState}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href="/follow-up">Review draft</Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="calls" className="mt-4">
                <EmptyState
                  title="Jump into the call loop"
                  description="Prep a prospect, open live capture, then post-call review."
                  actionLabel="Open Calls"
                  actionHref="/calls"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-ai/20 bg-gradient-to-b from-ai/5 to-transparent">
          <CardHeader>
            <CardTitle>Revenue Copilot</CardTitle>
            <p className="text-sm text-muted-foreground">
              What should I focus on today?
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.insights.map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="secondary">
                <Link href="/prospects">Open Prospects</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/follow-up">Follow-Up drafts</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/learning">Learning</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
