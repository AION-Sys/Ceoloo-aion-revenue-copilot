import { describe, expect, it } from "vitest";
import {
  applyEconomicImpactToProfile,
  computeMonthlyRevenueExposure,
  formatEconomicImpactSummary,
  hasQuantifiedEconomicImpact,
  parseEconomicImpact,
  withComputedExposure,
} from "@/lib/sales/economic-impact";
import { deriveQualificationState } from "@/lib/sales/qualification-engine";
import type { QualificationProfile } from "@/lib/sales/types";

describe("computeMonthlyRevenueExposure", () => {
  it("computes leads × delayed_share × avg_job_value × close_rate", () => {
    // 40 leads/mo × 25% delayed × $4,000 job × 30% close = $12,000
    expect(
      computeMonthlyRevenueExposure({
        leadsPerMonth: 40,
        delayedShare: 0.25,
        avgJobValue: 4000,
        closeRate: 0.3,
      }),
    ).toBe(12000);
  });

  it("returns null when any required input is missing or invalid", () => {
    expect(
      computeMonthlyRevenueExposure({
        leadsPerMonth: 40,
        delayedShare: 0.25,
        avgJobValue: 4000,
      }),
    ).toBeNull();
    expect(
      computeMonthlyRevenueExposure({
        leadsPerMonth: -1,
        delayedShare: 0.25,
        avgJobValue: 4000,
        closeRate: 0.3,
      }),
    ).toBeNull();
    expect(
      computeMonthlyRevenueExposure({
        leadsPerMonth: 10,
        delayedShare: 1.5,
        avgJobValue: 4000,
        closeRate: 0.3,
      }),
    ).toBeNull();
  });
});

describe("withComputedExposure + format", () => {
  it("fills monthlyRevenueExposure and formats a readable summary", () => {
    const impact = withComputedExposure({
      leadsPerMonth: 20,
      delayedShare: 0.5,
      avgJobValue: 2000,
      closeRate: 0.2,
      source: "rep_estimate",
    });
    expect(impact.monthlyRevenueExposure).toBe(4000);
    expect(formatEconomicImpactSummary(impact)).toMatch(/\$4,000/);
    expect(formatEconomicImpactSummary(impact)).toMatch(/mo exposure/i);
    expect(hasQuantifiedEconomicImpact(impact)).toBe(true);
  });
});

describe("applyEconomicImpactToProfile", () => {
  it("syncs businessImpact text when exposure is computed", () => {
    const profile: QualificationProfile = {
      currentWorkflow: "Phone chase",
    };
    const next = applyEconomicImpactToProfile(profile, {
      leadsPerMonth: 30,
      delayedShare: 0.2,
      avgJobValue: 5000,
      closeRate: 0.25,
      source: "prospect_stated",
    });

    expect(next.economicImpact?.monthlyRevenueExposure).toBe(7500);
    expect(next.businessImpact).toMatch(/\$7,500/);
    expect(hasQuantifiedEconomicImpact(next.economicImpact)).toBe(true);

    const state = deriveQualificationState(next);
    const impact = state.flags.find((f) => f.id === "impact_quantified");
    expect(impact?.confirmed).toBe(true);
  });

  it("does not invent exposure from incomplete inputs", () => {
    const next = applyEconomicImpactToProfile(
      {},
      { leadsPerMonth: 10, delayedShare: 0.5 },
    );
    expect(next.economicImpact?.monthlyRevenueExposure).toBeUndefined();
    expect(next.businessImpact).toBeUndefined();
    expect(hasQuantifiedEconomicImpact(next.economicImpact)).toBe(false);
  });
});

describe("parseEconomicImpact", () => {
  it("parses numeric fields from unknown payloads", () => {
    const parsed = parseEconomicImpact({
      leadsPerMonth: "40",
      delayedShare: "0.25",
      avgJobValue: 4000,
      closeRate: 0.3,
      source: "rep_estimate",
      notes: "Owner estimate",
    });
    expect(parsed?.leadsPerMonth).toBe(40);
    expect(parsed?.delayedShare).toBe(0.25);
    expect(parsed?.monthlyRevenueExposure).toBe(12000);
    expect(parsed?.notes).toBe("Owner estimate");
  });

  it("returns undefined for empty / invalid objects", () => {
    expect(parseEconomicImpact(null)).toBeUndefined();
    expect(parseEconomicImpact({})).toBeUndefined();
    expect(parseEconomicImpact({ delayedShare: 2 })).toBeUndefined();
  });
});
