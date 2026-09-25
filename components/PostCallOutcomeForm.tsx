"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QUALIFICATION_OPTIONS } from "@/lib/intelligence/call-workspace";
import type { CallOutcome, ObjectionRecord, QualificationState } from "@/lib/sales/types";
import { cn } from "@/lib/utils";

type PostCallOutcomeFormProps = {
  callId: string;
  companyName: string;
  leadId: string;
  initialOutcome?: CallOutcome;
  suggestedPainPoints?: string[];
  suggestedObjection?: string;
  suggestedNextAction?: string;
  /** When false (demo without Supabase), form is viewable but save is disabled. */
  canPersist?: boolean;
};

function emptyObjection(objection = ""): ObjectionRecord {
  return { objection, resolved: false };
}

export function PostCallOutcomeForm({
  callId,
  companyName,
  leadId,
  initialOutcome,
  suggestedPainPoints = [],
  suggestedObjection,
  suggestedNextAction,
  canPersist = true,
}: PostCallOutcomeFormProps) {
  const router = useRouter();
  const [qualification, setQualification] = useState<QualificationState>(
    initialOutcome?.qualification ?? "exploring",
  );
  const [painPoints, setPainPoints] = useState<string[]>(() => {
    if (initialOutcome?.painPoints.length) {
      return initialOutcome.painPoints;
    }
    if (suggestedPainPoints.length) {
      return [...suggestedPainPoints];
    }
    return [""];
  });
  const [objections, setObjections] = useState<ObjectionRecord[]>(() => {
    if (initialOutcome?.objections.length) {
      return initialOutcome.objections;
    }
    if (suggestedObjection) {
      return [emptyObjection(suggestedObjection)];
    }
    return [emptyObjection()];
  });
  const [nextAction, setNextAction] = useState(
    initialOutcome?.nextAction ?? suggestedNextAction ?? "",
  );
  const [transcriptSummary, setTranscriptSummary] = useState(
    initialOutcome?.transcriptSummary ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [savedOutcome, setSavedOutcome] = useState<CallOutcome | null>(
    initialOutcome ?? null,
  );
  const [isPending, startTransition] = useTransition();

  const readOnly = Boolean(savedOutcome) || !canPersist;

  function updatePainPoint(index: number, value: string) {
    setPainPoints((current) => current.map((item, i) => (i === index ? value : item)));
  }

  function addPainPoint() {
    setPainPoints((current) => [...current, ""]);
  }

  function removePainPoint(index: number) {
    setPainPoints((current) => current.filter((_, i) => i !== index));
  }

  function updateObjection(index: number, patch: Partial<ObjectionRecord>) {
    setObjections((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addObjection() {
    setObjections((current) => [...current, emptyObjection()]);
  }

  function removeObjection(index: number) {
    setObjections((current) => current.filter((_, i) => i !== index));
  }

  function submitOutcome() {
    if (!canPersist) {
      setError("Supabase is not configured. Outcome persistence requires a database connection.");
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(`/api/calls/${callId}/outcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qualification,
            painPoints: painPoints.map((item) => item.trim()).filter(Boolean),
            objections: objections
              .map((item) => ({
                objection: item.objection.trim(),
                resolved: item.resolved,
                suggestedReframe: item.suggestedReframe?.trim() || undefined,
              }))
              .filter((item) => item.objection),
            nextAction: nextAction.trim(),
            transcriptSummary: transcriptSummary.trim() || undefined,
          }),
        });

        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          outcome?: CallOutcome;
        } | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to save outcome.");
        }

        if (payload?.outcome) {
          setSavedOutcome(payload.outcome);
        }

        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "Unable to save outcome.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {!canPersist && !savedOutcome ? (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Demo session without Supabase — you can review fields below, but saving a{" "}
            <code className="text-xs">call_outcomes</code> row requires Supabase. CRM and
            learning ingest remain stubs for Tasks 7–8.
          </CardContent>
        </Card>
      ) : null}

      {savedOutcome ? (
        <Card className="border-primary/30 bg-muted/30">
          <CardHeader>
            <CardTitle>Outcome saved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Call marked complete. CRM and learning wiring land in Tasks 7–8 — outcome is
              stored for {companyName}.
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Qualification: {savedOutcome.qualification}</li>
              <li>Next action: {savedOutcome.nextAction}</li>
              {savedOutcome.painPoints.length > 0 ? (
                <li>Pain points: {savedOutcome.painPoints.join(", ")}</li>
              ) : null}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="outline">
                <Link href={`/leads/${leadId}`}>Back to lead brief</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/calls">Calls</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Qualification</CardTitle>
        </CardHeader>
        <CardContent>
          <fieldset disabled={readOnly || isPending}>
            <legend className="sr-only">Call qualification</legend>
            <div
              className="grid gap-2 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Qualification"
            >
              {QUALIFICATION_OPTIONS.map((option) => {
                const selected = qualification === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "cursor-pointer rounded-lg border p-3 transition-colors",
                      selected && "border-primary bg-muted/50",
                      (readOnly || isPending) && "cursor-not-allowed opacity-70",
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="post-call-qualification"
                      value={option.value}
                      checked={selected}
                      onChange={() => setQualification(option.value)}
                      disabled={readOnly || isPending}
                    />
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pain points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {painPoints.map((pain, index) => (
              <div className="flex gap-2" key={`pain-${index}`}>
                <Input
                  type="text"
                  value={pain}
                  onChange={(event) => updatePainPoint(index, event.target.value)}
                  placeholder="e.g. slow lead response"
                  disabled={readOnly || isPending}
                />
                {!readOnly && painPoints.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removePainPoint(index)}
                    disabled={isPending}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
          {!readOnly ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addPainPoint}
              disabled={isPending}
            >
              Add pain point
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            {objections.map((item, index) => (
              <div className="space-y-2 rounded-lg border p-3" key={`objection-${index}`}>
                <label className="block space-y-1.5">
                  <span className="text-xs text-muted-foreground">Objection</span>
                  <Input
                    type="text"
                    value={item.objection}
                    onChange={(event) =>
                      updateObjection(index, { objection: event.target.value })
                    }
                    placeholder="e.g. too expensive"
                    disabled={readOnly || isPending}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border"
                    checked={item.resolved}
                    onChange={(event) =>
                      updateObjection(index, { resolved: event.target.checked })
                    }
                    disabled={readOnly || isPending}
                  />
                  <span>Resolved on call</span>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs text-muted-foreground">
                    Suggested reframe (optional)
                  </span>
                  <Input
                    type="text"
                    value={item.suggestedReframe ?? ""}
                    onChange={(event) =>
                      updateObjection(index, { suggestedReframe: event.target.value })
                    }
                    disabled={readOnly || isPending}
                  />
                </label>
                {!readOnly && objections.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeObjection(index)}
                    disabled={isPending}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
          {!readOnly ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addObjection}
              disabled={isPending}
            >
              Add objection
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next action</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">
              What happens next with this lead?
            </span>
            <Input
              type="text"
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
              placeholder="e.g. send proposal by Friday"
              required
              disabled={readOnly || isPending}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call summary (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">Transcript or notes summary</span>
            <textarea
              className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              rows={4}
              value={transcriptSummary}
              onChange={(event) => setTranscriptSummary(event.target.value)}
              placeholder="Key takeaways from the conversation…"
              disabled={readOnly || isPending}
            />
          </label>
        </CardContent>
      </Card>

      {!savedOutcome ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/calls/${callId}/live`}>Back to live call</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={submitOutcome}
            disabled={isPending || !nextAction.trim() || !canPersist}
          >
            {isPending ? "Saving…" : "Save outcome & complete call"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
