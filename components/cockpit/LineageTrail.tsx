import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LineageTrail as LineageTrailModel } from "@/lib/cockpit/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  done: "Done",
  blocked: "Blocked",
};

type LineageTrailProps = {
  trail: LineageTrailModel;
  className?: string;
};

export function LineageTrail({ trail, className }: LineageTrailProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Lineage</CardTitle>
        <p className="text-sm text-muted-foreground">
          Conversation → evidence → recommendation → decision → CRM → outcome
        </p>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {trail.steps.map((step, index) => (
            <li key={step.id} className="flex gap-3">
              <div className="flex w-6 flex-col items-center">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                    step.status === "done" && "bg-emerald-500/15 text-emerald-700",
                    step.status === "active" && "bg-ai/15 text-ai",
                    step.status === "blocked" && "bg-destructive/15 text-destructive",
                    step.status === "pending" && "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                {index < trail.steps.length - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-border" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{step.label}</p>
                  <Badge variant="outline">{STATUS_LABEL[step.status]}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
