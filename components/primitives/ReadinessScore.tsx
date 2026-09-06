import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ReadinessScoreProps = {
  score: number;
  label?: string;
  className?: string;
};

export function ReadinessScore({
  score,
  label = "Readiness",
  className,
}: ReadinessScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{clamped}%</p>
      </div>
      <Progress value={clamped} />
    </div>
  );
}
