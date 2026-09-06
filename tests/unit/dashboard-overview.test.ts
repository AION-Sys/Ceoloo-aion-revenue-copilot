import { describe, expect, it } from "vitest";
import { buildOverviewDashboard } from "@/lib/dashboard/overview";
import type { Lead } from "@/lib/sales/types";

const baseLead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme HVAC",
  contactName: "Jordan Lee",
  source: "outbound",
  status: "new",
};

describe("buildOverviewDashboard", () => {
  it("returns zeroed call metrics without fabricating activity", () => {
    const overview = buildOverviewDashboard([]);
    expect(overview.leadCount).toBe(0);
    expect(overview.todayQueue).toEqual([]);
    expect(overview.kpis.find((kpi) => kpi.id === "calls-today")?.value).toBe("0");
    expect(overview.insights[0]?.id).toBe("insight-empty");
  });

  it("maps active leads into the today priority queue", () => {
    const overview = buildOverviewDashboard([baseLead]);
    expect(overview.leadCount).toBe(1);
    expect(overview.todayQueue).toHaveLength(1);
    expect(overview.todayQueue[0]?.href).toBe("/leads/lead-1");
    expect(overview.insights.some((insight) => insight.kind === "action")).toBe(true);
  });

  it("counts qualified leads in KPIs", () => {
    const overview = buildOverviewDashboard([
      { ...baseLead, status: "qualified" },
      { ...baseLead, id: "lead-2", status: "contacted", companyName: "Beta" },
    ]);
    expect(overview.kpis.find((kpi) => kpi.id === "qualified")?.value).toBe("1");
    expect(overview.kpis.find((kpi) => kpi.id === "conversations")?.value).toBe("2");
  });
});
