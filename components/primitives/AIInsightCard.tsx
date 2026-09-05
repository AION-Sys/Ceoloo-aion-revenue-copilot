import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AiInsight } from "@/lib/dashboard/overview";

const KIND_VARIANT = {
  risk: "destructive",
  opportunity: "success",
  action: "ai",
  pattern: "secondary",
} as const;

type AIInsightCardProps = {
  insight: AiInsight;
  className?: string;
};

export function AIInsightCard({ insight, className }: AIInsightCardProps) {
  const body = (
    <article
      className={cn(
        "rounded-lg border border-border/80 bg-background/60 p-3 transition-colors hover:bg-muted/40",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Badge variant={KIND_VARIANT[insight.kind]}>{insight.kind}</Badge>
        <span className="text-xs text-muted-foreground">
          {Math.round(insight.confidence * 100)}% confidence
        </span>
      </div>
      <h4 className="text-sm font-medium leading-snug">{insight.title}</h4>
      <p className="mt-1 text-xs text-muted-foreground">{insight.detail}</p>
    </article>
  );

  if (insight.href) {
    return (
      <Link href={insight.href} className="block">
        {body}
      </Link>
    );
  }

  return body;
}
