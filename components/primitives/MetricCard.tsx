import { cn } from "@/lib/utils";
import type { DashboardKpi } from "@/lib/dashboard/overview";

type MetricCardProps = {
  kpi: DashboardKpi;
  className?: string;
};

export function MetricCard({ kpi, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-hidden px-4 py-3.5 transition-colors duration-200 hover:bg-muted/40",
        className,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {kpi.label}
      </p>
      <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight tabular">
        {kpi.value}
      </p>
      {kpi.secondary ? (
        <p
          className={cn(
            "mt-1 text-xs",
            kpi.trend === "up" && "text-success",
            kpi.trend === "down" && "text-destructive",
            kpi.trend === "flat" && "text-muted-foreground",
          )}
        >
          {kpi.secondary}
        </p>
      ) : null}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-ai/50 transition-transform duration-300 ease-cockpit group-hover:scale-x-100"
      />
    </div>
  );
}
