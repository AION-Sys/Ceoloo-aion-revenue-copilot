import Link from "next/link";
import { Phone, UserPlus, Upload } from "lucide-react";
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {repName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here’s what needs your attention today.
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
            <Link href="/contacts">
              <UserPlus className="h-4 w-4" />
              Add Lead
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/contacts">
              <Upload className="h-4 w-4" />
              Import Prospect
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
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
              </TabsList>
              <TabsContent value="priority" className="mt-4 space-y-0">
                {overview.todayQueue.length === 0 ? (
                  <EmptyState
                    title="Nothing in today’s priority queue"
                    description="Add a lead or start a call to begin the Prepare → Call → Capture loop."
                    actionLabel="Add Lead"
                    actionHref="/contacts"
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
                            <span className="text-ai">AI recommendation:</span>{" "}
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
              <TabsContent value="followups">
                <EmptyState
                  title="No follow-ups queued"
                  description="Post-call outcomes will create follow-up tasks here."
                  actionLabel="View Tasks"
                  actionHref="/tasks"
                />
              </TabsContent>
              <TabsContent value="calls">
                <EmptyState
                  title="No calls scheduled for today"
                  description="Start a call from a priority prospect to open the live workspace."
                  actionLabel="Open Calls"
                  actionHref="/calls"
                />
              </TabsContent>
              <TabsContent value="tasks">
                <EmptyState
                  title="No tasks due today"
                  description="Tasks connected to deals and calls will appear in this queue."
                  actionLabel="Open Tasks"
                  actionHref="/tasks"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-ai/20 bg-gradient-to-b from-ai/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Revenue Copilot
            </CardTitle>
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
                <Link href="/intelligence">Ask Copilot</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/tasks">Generate follow-up</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/calls">Build call plan</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/pipeline">Summarize pipeline</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
