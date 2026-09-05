import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANT = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
} as const;

const PRIORITY_LABEL = {
  high: "High Priority",
  medium: "Medium",
  low: "Low",
} as const;

type PriorityBadgeProps = {
  priority: "high" | "medium" | "low";
  className?: string;
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge
      variant={PRIORITY_VARIANT[priority]}
      className={cn("font-medium", className)}
    >
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}
