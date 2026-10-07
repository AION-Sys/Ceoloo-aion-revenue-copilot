import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-dashed border-border/80 bg-background/40 p-6",
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {actionLabel && actionHref ? (
        <Button asChild size="sm" className="active:scale-[0.98]">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
