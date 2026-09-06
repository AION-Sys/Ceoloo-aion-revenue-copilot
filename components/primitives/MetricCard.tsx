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
        "min-w-0 border-r border-border px-4 py-3 last:border-r-0",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">{kpi.label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{kpi.value}</p>
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
    </div>
  );
}
