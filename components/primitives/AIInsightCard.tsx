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
        "interactive-row rounded-md border border-border/70 bg-background/50 p-3",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Badge variant={KIND_VARIANT[insight.kind]} className="rounded-sm">
          {insight.kind}
        </Badge>
        <span className="font-mono text-[11px] tabular text-muted-foreground">
          {Math.round(insight.confidence * 100)}%
        </span>
      </div>
      <h4 className="text-sm font-semibold leading-snug tracking-tight">
        {insight.title}
      </h4>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {insight.detail}
      </p>
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
