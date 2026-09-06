import type { Lead } from "@/lib/sales/types";

export type DashboardKpi = {
  id: string;
  label: string;
  value: string;
  secondary?: string;
  trend?: "up" | "down" | "flat";
};

export type TodayQueueItem = {
  id: string;
  contactName: string;
  companyName: string;
  priority: "high" | "medium" | "low";
  stage: string;
  lastInteraction: string;
  recommendation: string;
  dueLabel: string;
  href: string;
};

export type AiInsight = {
  id: string;
  title: string;
  detail: string;
  confidence: number;
  kind: "risk" | "opportunity" | "action" | "pattern";
  href?: string;
};

export type OverviewDashboard = {
  kpis: DashboardKpi[];
  todayQueue: TodayQueueItem[];
  insights: AiInsight[];
  leadCount: number;
};

function stageFromLeadStatus(status: Lead["status"]): string {
  switch (status) {
    case "new":
      return "New";
    case "contacted":
      return "Contacted";
    case "qualified":
      return "Qualified";
    case "closed":
      return "Closed";
    default:
      return status ?? "Unknown";
  }
}

function priorityFromStatus(status: Lead["status"]): TodayQueueItem["priority"] {
  if (status === "qualified") return "high";
  if (status === "contacted") return "medium";
  return "low";
}

function recommendationForLead(lead: Lead): string {
  switch (lead.status) {
    case "new":
      return "Open the pre-call brief and start discovery while context is fresh.";
    case "contacted":
      return "Follow up on open questions and advance qualification.";
    case "qualified":
      return "Confirm next action and move the opportunity toward application.";
    case "closed":
      return "Archive outcome notes and capture learning signals.";
    default:
      return "Review prospect context and choose the next best action.";
  }
}

/**
 * Builds overview metrics from canonical lead state.
 * Values stay zero/empty when no activity exists — no fabricated production KPIs.
 */
export function buildOverviewDashboard(leads: Lead[]): OverviewDashboard {
  const active = leads.filter((lead) => lead.status !== "closed");
  const qualified = leads.filter((lead) => lead.status === "qualified").length;
  const contacted = leads.filter(
    (lead) => lead.status === "contacted" || lead.status === "qualified",
  ).length;

  const kpis: DashboardKpi[] = [
    {
      id: "calls-today",
      label: "Calls Today",
      value: "0",
      secondary: "No calls logged yet",
      trend: "flat",
    },
    {
      id: "conversations",
      label: "Conversations",
      value: String(contacted),
      secondary: contacted ? "From lead contact activity" : "Awaiting first contact",
      trend: contacted ? "up" : "flat",
    },
    {
      id: "qualified",
      label: "Qualified",
      value: String(qualified),
      secondary: qualified ? "Ready for next step" : "None qualified yet",
      trend: qualified ? "up" : "flat",
    },
    {
      id: "commitments",
      label: "Applications / Commitments",
      value: "0",
      secondary: "Tracked after post-call outcomes",
      trend: "flat",
    },
    {
      id: "pipeline",
      label: "Pipeline Value",
      value: "—",
      secondary: "Deal values land with pipeline phase",
      trend: "flat",
    },
    {
      id: "readiness",
      label: "Close Readiness",
      value: active.length ? `${Math.min(90, 20 + qualified * 25)}%` : "—",
      secondary: active.length
        ? "Derived from current qualification mix"
        : "No active opportunities",
      trend: qualified ? "up" : "flat",
    },
  ];

  const todayQueue: TodayQueueItem[] = active.map((lead) => ({
    id: lead.id,
    contactName: lead.contactName?.trim() || "Unknown contact",
    companyName: lead.companyName,
    priority: priorityFromStatus(lead.status),
    stage: stageFromLeadStatus(lead.status),
    lastInteraction: lead.status === "new" ? "No interaction yet" : "Lead status updated",
    recommendation: recommendationForLead(lead),
    dueLabel: "Today",
    href: `/leads/${lead.id}`,
  }));

  const insights: AiInsight[] = [];

  for (const lead of active.slice(0, 3)) {
    if (lead.status === "new") {
      insights.push({
        id: `insight-new-${lead.id}`,
        title: `${lead.contactName ?? lead.companyName} has no follow-up yet`,
        detail: "High-intent prep: open the pre-call brief before first contact.",
        confidence: 0.72,
        kind: "action",
        href: `/leads/${lead.id}`,
      });
    }
    if (lead.status === "qualified") {
      insights.push({
        id: `insight-qual-${lead.id}`,
        title: `${lead.companyName} is qualified and needs a next action`,
        detail: "Confirm documents or commitment path while momentum is high.",
        confidence: 0.81,
        kind: "opportunity",
        href: `/leads/${lead.id}`,
      });
    }
  }

  if (leads.length === 0) {
    insights.push({
      id: "insight-empty",
      title: "No pipeline signals yet",
      detail: "Add a lead or import a prospect to start Revenue Copilot intelligence.",
      confidence: 1,
      kind: "pattern",
    });
  }

  return {
    kpis,
    todayQueue,
    insights,
    leadCount: leads.length,
  };
}
