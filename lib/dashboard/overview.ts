import {
  funnelStageLabel,
  isConversationStage,
  isOpenFunnelStage,
  isQualifiedFunnelStage,
  nextActionForStage,
} from "@/lib/sales/motion";
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

function priorityFromStatus(status: Lead["status"]): TodayQueueItem["priority"] {
  if (isQualifiedFunnelStage(status)) return "high";
  if (
    status === "business_audit" ||
    status === "problem_diagnosis" ||
    status === "onboarding"
  ) {
    return "medium";
  }
  return "low";
}

/**
 * Builds overview metrics from canonical lead state.
 * Values stay zero/empty when no activity exists — no fabricated production KPIs.
 */
export function buildOverviewDashboard(leads: Lead[]): OverviewDashboard {
  const active = leads.filter((lead) => isOpenFunnelStage(lead.status));
  const qualified = leads.filter((lead) => isQualifiedFunnelStage(lead.status)).length;
  const contacted = leads.filter((lead) => isConversationStage(lead.status)).length;
  const proposals = leads.filter((lead) => lead.status === "proposal").length;

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
      id: "proposals",
      label: "Proposals",
      value: String(proposals),
      secondary: proposals ? "In proposal stage" : "None in proposal yet",
      trend: proposals ? "up" : "flat",
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
    stage: funnelStageLabel(lead.status),
    lastInteraction: lead.status === "lead" || !lead.status ? "No interaction yet" : "Funnel stage updated",
    recommendation: nextActionForStage(lead.status),
    dueLabel: "Today",
    href: `/leads/${lead.id}`,
  }));

  const insights: AiInsight[] = [];

  for (const lead of active.slice(0, 3)) {
    if (lead.status === "lead" || !lead.status) {
      insights.push({
        id: `insight-new-${lead.id}`,
        title: `${lead.contactName ?? lead.companyName} has no follow-up yet`,
        detail: "Open the pre-call brief and start the business audit.",
        confidence: 0.72,
        kind: "action",
        href: `/leads/${lead.id}`,
      });
    }
    if (isQualifiedFunnelStage(lead.status)) {
      insights.push({
        id: `insight-qual-${lead.id}`,
        title: `${lead.companyName} is a qualified opportunity`,
        detail: "Confirm implementation scope and move toward a proposal.",
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
