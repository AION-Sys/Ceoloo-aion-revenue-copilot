"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowUpRight, Phone, Sparkles, Users } from "lucide-react";
import { AIInsightCard } from "@/components/primitives/AIInsightCard";
import { EmptyState } from "@/components/primitives/EmptyState";
import { MetricCard } from "@/components/primitives/MetricCard";
import { PriorityBadge } from "@/components/primitives/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OverviewDashboard } from "@/lib/dashboard/overview";
import type { FollowUpDraft } from "@/lib/cockpit/types";
import { cn } from "@/lib/utils";

type CommandCenterProps = {
  greeting: string;
  repName: string;
  overview: OverviewDashboard;
  followUps: FollowUpDraft[];
};

export function CommandCenter({
  greeting,
  repName,
  overview,
  followUps,
}: CommandCenterProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    overview.todayQueue[0]?.id ?? null,
  );
  const [tab, setTab] = useState("priority");
  const [, startTransition] = useTransition();

  const selected =
    overview.todayQueue.find((item) => item.id === selectedId) ??
    overview.todayQueue[0] ??
    null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="cockpit-enter flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ai">
            Command center
          </p>
          <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight md:text-[2rem]">
            {greeting}, {repName}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Priority prospects, governed follow-ups, and the next move — one composition.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="active:scale-[0.98]">
            <Link href="/calls">
              <Phone className="h-4 w-4" />
              Start call
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="active:scale-[0.98]">
            <Link href="/prospects">
              <Users className="h-4 w-4" />
              Prospects
            </Link>
          </Button>
        </div>
      </div>

      <section className="cockpit-panel cockpit-enter cockpit-stagger overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-y divide-border/80 md:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
          {overview.kpis.map((kpi) => (
            <MetricCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <section className="cockpit-panel cockpit-enter overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Today</h2>
              <p className="text-xs text-muted-foreground">
                Select a prospect to preview the recommended move
              </p>
            </div>
            <span className="font-mono text-[11px] tabular text-muted-foreground">
              {overview.todayQueue.length} queued
            </span>
          </div>

          <div className="p-3 sm:p-4">
            <Tabs
              value={tab}
              onValueChange={(value) => {
                startTransition(() => setTab(value));
              }}
            >
              <TabsList className="h-9 bg-muted/60">
                <TabsTrigger value="priority" className="text-xs">
                  Priority
                </TabsTrigger>
                <TabsTrigger value="followups" className="text-xs">
                  Follow-ups
                </TabsTrigger>
                <TabsTrigger value="calls" className="text-xs">
                  Calls
                </TabsTrigger>
              </TabsList>

              <TabsContent value="priority" className="mt-4 space-y-3">
                {overview.todayQueue.length === 0 ? (
                  <EmptyState
                    title="Nothing in today’s priority queue"
                    description="Add a prospect to begin Prepare → Call → Capture → Follow Up → Learn."
                    actionLabel="Open Prospects"
                    actionHref="/prospects"
                  />
                ) : (
                  <ul className="space-y-2">
                    {overview.todayQueue.map((item) => {
                      const active = selected?.id === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className={cn(
                              "interactive-row flex w-full flex-col gap-3 rounded-md border px-3 py-3 text-left sm:flex-row sm:items-start sm:justify-between",
                              active
                                ? "border-ai/40 bg-ai/5 shadow-cockpit"
                                : "border-border/70 bg-background/40",
                            )}
                          >
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold tracking-tight">
                                  {item.contactName}
                                </p>
                                <PriorityBadge priority={item.priority} />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {item.companyName}
                              </p>
                              <p className="text-xs">
                                <span className="text-muted-foreground">Stage</span>{" "}
                                <span className="font-medium">{item.stage}</span>
                              </p>
                              <p className="text-sm leading-snug">
                                <span className="text-ai">Move</span>{" "}
                                {item.recommendation}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                              <span className="font-mono text-[11px] tabular text-muted-foreground">
                                {item.dueLabel}
                              </span>
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  href={item.href}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  Open
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {selected ? (
                  <div className="rounded-md border border-dashed border-ai/30 bg-ai/5 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ai">
                      Focused move
                    </p>
                    <p className="mt-1 text-sm font-semibold tracking-tight">
                      {selected.contactName} · {selected.companyName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected.recommendation}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href={`${selected.href}/prep`}>Call prep</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={selected.href}>Prospect workspace</Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
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
                  <ul className="space-y-2">
                    {followUps.map((draft) => (
                      <li key={draft.id}>
                        <Link
                          href="/follow-up"
                          className="interactive-row flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/40 px-3 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold tracking-tight">
                              {draft.subject}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {draft.companyName} · {draft.evidenceState}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
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
          </div>
        </section>

        <aside className="cockpit-panel cockpit-enter overflow-hidden border-ai/25">
          <div className="border-b border-border/80 bg-gradient-to-br from-ai/10 via-transparent to-transparent px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ai" />
              <h2 className="text-sm font-semibold tracking-tight">Revenue Copilot</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              What should I focus on today?
            </p>
          </div>
          <div className="space-y-3 p-3 sm:p-4">
            {overview.insights.map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="secondary" className="active:scale-[0.98]">
                <Link href="/prospects">Prospects</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="active:scale-[0.98]">
                <Link href="/follow-up">Follow-Up</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="active:scale-[0.98]">
                <Link href="/learning">Learning</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
