"use client";

import {
  formatCurrency,
  formatEconomicImpactSummary,
  hasQuantifiedEconomicImpact,
  withComputedExposure,
} from "@/lib/sales/economic-impact";
import type { EconomicImpact, EconomicImpactSource } from "@/lib/sales/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EconomicImpactFieldsProps = {
  value?: EconomicImpact;
  onChange: (next: EconomicImpact | undefined) => void;
  disabled?: boolean;
  className?: string;
};

function numOrEmpty(value: number | undefined): string {
  return value === undefined || Number.isNaN(value) ? "" : String(value);
}

function parseOptionalNumber(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** UI collects percent 0–100; model stores 0–1. */
function shareToPercentInput(share: number | undefined): string {
  if (share === undefined) return "";
  return String(Math.round(share * 1000) / 10);
}

function percentInputToShare(raw: string): number | undefined {
  const n = parseOptionalNumber(raw);
  if (n === undefined) return undefined;
  return Math.min(100, Math.max(0, n)) / 100;
}

export function EconomicImpactFields({
  value,
  onChange,
  disabled,
  className,
}: EconomicImpactFieldsProps) {
  const current = value ?? {};
  const computed = withComputedExposure(current);
  const quantified = hasQuantifiedEconomicImpact(computed);

  function patch(partial: Partial<EconomicImpact>) {
    const next = withComputedExposure({ ...current, ...partial });
    const hasAny =
      next.leadsPerMonth !== undefined ||
      next.delayedShare !== undefined ||
      next.avgJobValue !== undefined ||
      next.closeRate !== undefined ||
      Boolean(next.notes?.trim()) ||
      Boolean(next.source);
    onChange(hasAny ? next : undefined);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-medium">Economic impact</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          leads/month × delayed share × avg job value × close rate ≈ monthly revenue
          exposure. Leave blank until the prospect states numbers — never invent ROI.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Leads / month</span>
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="decimal"
            value={numOrEmpty(current.leadsPerMonth)}
            onChange={(event) => patch({ leadsPerMonth: parseOptionalNumber(event.target.value) })}
            disabled={disabled}
            placeholder="e.g. 40"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Delayed / missed share (%)</span>
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="decimal"
            value={shareToPercentInput(current.delayedShare)}
            onChange={(event) =>
              patch({ delayedShare: percentInputToShare(event.target.value) })
            }
            disabled={disabled}
            placeholder="e.g. 25"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Avg job value ($)</span>
          <Input
            type="number"
            min={0}
            step={100}
            inputMode="decimal"
            value={numOrEmpty(current.avgJobValue)}
            onChange={(event) => patch({ avgJobValue: parseOptionalNumber(event.target.value) })}
            disabled={disabled}
            placeholder="e.g. 4000"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">Close rate (%)</span>
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="decimal"
            value={shareToPercentInput(current.closeRate)}
            onChange={(event) => patch({ closeRate: percentInputToShare(event.target.value) })}
            disabled={disabled}
            placeholder="e.g. 30"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs text-muted-foreground">Source</span>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={current.source ?? ""}
          onChange={(event) =>
            patch({
              source: (event.target.value || undefined) as EconomicImpactSource | undefined,
            })
          }
          disabled={disabled}
        >
          <option value="">Not set</option>
          <option value="prospect_stated">Prospect stated</option>
          <option value="rep_estimate">Rep estimate</option>
          <option value="derived">Derived from notes</option>
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs text-muted-foreground">Notes</span>
        <Input
          type="text"
          value={current.notes ?? ""}
          onChange={(event) => patch({ notes: event.target.value || undefined })}
          disabled={disabled}
          placeholder="Optional context for the estimate"
        />
      </label>

      <div
        className={cn(
          "rounded-lg border px-3 py-2.5 text-sm",
          quantified ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-muted/20",
        )}
        aria-live="polite"
      >
        {quantified ? (
          <>
            <p className="font-medium">
              {formatCurrency(computed.monthlyRevenueExposure!)} / mo exposure
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatEconomicImpactSummary(computed)}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            Fill all four inputs to compute monthly revenue exposure.
          </p>
        )}
      </div>
    </div>
  );
}
