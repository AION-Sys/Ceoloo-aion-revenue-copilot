"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { recordInterventionFeedbackAction } from "@/lib/learning/actions";
import { cn } from "@/lib/utils";

type InterventionFeedbackProps = {
  interventionId: string;
  initialUseful?: boolean | null;
  initialRepUsed?: boolean | null;
  compact?: boolean;
  className?: string;
};

export function InterventionFeedback({
  interventionId,
  initialUseful = null,
  initialRepUsed = null,
  compact = false,
  className,
}: InterventionFeedbackProps) {
  const [useful, setUseful] = useState<boolean | null>(initialUseful);
  const [repUsed, setRepUsed] = useState<boolean | null>(initialRepUsed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(partial: { useful?: boolean | null; repUsed?: boolean | null }) {
    setError(null);
    if (partial.useful !== undefined) setUseful(partial.useful);
    if (partial.repUsed !== undefined) setRepUsed(partial.repUsed);

    startTransition(async () => {
      const result = await recordInterventionFeedbackAction({
        interventionId,
        feedback: partial,
      });
      if (!result.ok) {
        setError(result.reason === "not_found" ? "Intervention not in store yet" : "Could not save");
      }
    });
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className={cn("flex flex-wrap gap-1.5", compact && "gap-1")}>
        <Button
          type="button"
          size="sm"
          variant={repUsed === true ? "default" : "outline"}
          disabled={pending}
          className={cn(compact && "h-7 px-2 text-[11px]")}
          onClick={() => submit({ repUsed: true })}
        >
          Used
        </Button>
        <Button
          type="button"
          size="sm"
          variant={repUsed === false ? "secondary" : "outline"}
          disabled={pending}
          className={cn(compact && "h-7 px-2 text-[11px]")}
          onClick={() => submit({ repUsed: false })}
        >
          Skipped
        </Button>
        <Button
          type="button"
          size="sm"
          variant={useful === true ? "default" : "outline"}
          disabled={pending}
          className={cn(compact && "h-7 px-2 text-[11px]")}
          onClick={() => submit({ useful: true, repUsed: repUsed ?? true })}
        >
          Useful
        </Button>
        <Button
          type="button"
          size="sm"
          variant={useful === false ? "destructive" : "outline"}
          disabled={pending}
          className={cn(compact && "h-7 px-2 text-[11px]")}
          onClick={() => submit({ useful: false })}
        >
          Not useful
        </Button>
      </div>
      {!compact ? (
        <p className="font-mono text-[10px] text-muted-foreground">{interventionId}</p>
      ) : null}
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
