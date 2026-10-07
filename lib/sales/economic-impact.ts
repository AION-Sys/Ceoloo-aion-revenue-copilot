import type {
  EconomicImpact,
  EconomicImpactSource,
  QualificationProfile,
} from "@/lib/sales/types";

/**
 * Quantified revenue exposure for diagnosis / proposal (finish-line P0).
 *
 * Formula: leads/month × delayed_share × avg_job_value × close_rate
 *         ≈ monthly_revenue_exposure
 *
 * Never invent numbers — only compute when all four inputs are present and valid.
 */

export type EconomicImpactInputs = Pick<
  EconomicImpact,
  "leadsPerMonth" | "delayedShare" | "avgJobValue" | "closeRate"
>;

const SOURCES: EconomicImpactSource[] = ["rep_estimate", "prospect_stated", "derived"];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asNonNegativeNumber(value: unknown): number | undefined {
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    return undefined;
  }
  if (isFiniteNumber(value) && value >= 0) return value;
  return undefined;
}

function asUnitInterval(value: unknown): number | undefined {
  const n = asNonNegativeNumber(value);
  if (n === undefined) return undefined;
  if (n > 1) return undefined;
  return n;
}

/**
 * leads/month × delayed_share × avg_job_value × close_rate
 * Returns null when any input is missing or out of range (never invent).
 */
export function computeMonthlyRevenueExposure(
  input: EconomicImpactInputs,
): number | null {
  const leads = input.leadsPerMonth;
  const delayed = input.delayedShare;
  const job = input.avgJobValue;
  const close = input.closeRate;

  if (
    !isFiniteNumber(leads) ||
    leads < 0 ||
    !isFiniteNumber(delayed) ||
    delayed < 0 ||
    delayed > 1 ||
    !isFiniteNumber(job) ||
    job < 0 ||
    !isFiniteNumber(close) ||
    close < 0 ||
    close > 1
  ) {
    return null;
  }

  return Math.round(leads * delayed * job * close);
}

export function withComputedExposure(input: EconomicImpact): EconomicImpact {
  const monthlyRevenueExposure = computeMonthlyRevenueExposure(input);
  const next: EconomicImpact = { ...input };
  if (monthlyRevenueExposure === null) {
    delete next.monthlyRevenueExposure;
  } else {
    next.monthlyRevenueExposure = monthlyRevenueExposure;
  }
  return next;
}

export function hasQuantifiedEconomicImpact(
  impact: EconomicImpact | null | undefined,
): boolean {
  return (
    typeof impact?.monthlyRevenueExposure === "number" &&
    Number.isFinite(impact.monthlyRevenueExposure) &&
    impact.monthlyRevenueExposure > 0
  );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEconomicImpactSummary(impact: EconomicImpact): string {
  if (!hasQuantifiedEconomicImpact(impact)) {
    return "Exposure not yet quantified — capture leads/month, delayed share, avg job value, and close rate.";
  }

  const parts = [`~${formatCurrency(impact.monthlyRevenueExposure!)}/mo exposure`];
  if (
    isFiniteNumber(impact.leadsPerMonth) &&
    isFiniteNumber(impact.delayedShare) &&
    isFiniteNumber(impact.avgJobValue) &&
    isFiniteNumber(impact.closeRate)
  ) {
    parts.push(
      `(${impact.leadsPerMonth} leads × ${Math.round(impact.delayedShare * 100)}% delayed × ${formatCurrency(impact.avgJobValue)} × ${Math.round(impact.closeRate * 100)}% close)`,
    );
  }
  return parts.join(" ");
}

/**
 * Merge economic impact onto a qualification profile and sync businessImpact text
 * when exposure is quantified (so impact_quantified + UI completeness stay aligned).
 */
export function applyEconomicImpactToProfile(
  profile: QualificationProfile | undefined | null,
  impactInput: EconomicImpact | null | undefined,
): QualificationProfile {
  const base: QualificationProfile = { ...(profile ?? {}) };
  if (!impactInput) {
    delete base.economicImpact;
    return base;
  }

  const impact = withComputedExposure(impactInput);
  const hasAnyField =
    impact.leadsPerMonth !== undefined ||
    impact.delayedShare !== undefined ||
    impact.avgJobValue !== undefined ||
    impact.closeRate !== undefined ||
    Boolean(impact.notes?.trim()) ||
    Boolean(impact.source);

  if (!hasAnyField && impact.monthlyRevenueExposure === undefined) {
    delete base.economicImpact;
    return base;
  }

  base.economicImpact = impact;

  if (hasQuantifiedEconomicImpact(impact)) {
    const summary = formatEconomicImpactSummary(impact);
    if (!base.businessImpact?.trim()) {
      base.businessImpact = summary;
    } else if (!base.businessImpact.includes(formatCurrency(impact.monthlyRevenueExposure!))) {
      base.businessImpact = `${base.businessImpact.trim()} · ${summary}`;
    }
  }

  return base;
}

export function parseEconomicImpact(value: unknown): EconomicImpact | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const impact: EconomicImpact = {};

  const leadsPerMonth = asNonNegativeNumber(record.leadsPerMonth);
  const delayedShare = asUnitInterval(record.delayedShare);
  const avgJobValue = asNonNegativeNumber(record.avgJobValue);
  const closeRate = asUnitInterval(record.closeRate);

  if (leadsPerMonth !== undefined) impact.leadsPerMonth = leadsPerMonth;
  if (delayedShare !== undefined) impact.delayedShare = delayedShare;
  if (avgJobValue !== undefined) impact.avgJobValue = avgJobValue;
  if (closeRate !== undefined) impact.closeRate = closeRate;

  if (typeof record.notes === "string" && record.notes.trim()) {
    impact.notes = record.notes.trim();
  }

  if (
    typeof record.source === "string" &&
    SOURCES.includes(record.source as EconomicImpactSource)
  ) {
    impact.source = record.source as EconomicImpactSource;
  }

  const hasInputs =
    impact.leadsPerMonth !== undefined ||
    impact.delayedShare !== undefined ||
    impact.avgJobValue !== undefined ||
    impact.closeRate !== undefined ||
    Boolean(impact.notes) ||
    Boolean(impact.source);

  if (!hasInputs) {
    return undefined;
  }

  return withComputedExposure(impact);
}

/** Prep prompt when impact is not yet quantified. */
export function economicImpactDiscoveryQuestion(companyName: string): string {
  return `For ${companyName}: roughly how many leads/month, what share get delayed, average job value, and close rate — so we can size monthly revenue exposure?`;
}
