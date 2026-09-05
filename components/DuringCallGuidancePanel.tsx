"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createDiscoveryChecklist,
  QUALIFICATION_OPTIONS,
  type DiscoveryChecklistItem,
} from "@/lib/intelligence/call-workspace";
import type { DuringCallGuidance } from "@/lib/intelligence/during-call";
import type { QualificationState } from "@/lib/sales/types";
import { cn } from "@/lib/utils";

type DuringCallGuidancePanelProps = {
  callId: string;
  companyName: string;
  initialGuidance: DuringCallGuidance;
  initialQualification?: QualificationState;
};

export function DuringCallGuidancePanel({
  callId,
  companyName,
  initialGuidance,
  initialQualification = "unqualified",
}: DuringCallGuidancePanelProps) {
  const [guidance, setGuidance] = useState(initialGuidance);
  const [checklist, setChecklist] = useState<DiscoveryChecklistItem[]>(() =>
    createDiscoveryChecklist(initialGuidance.checklist),
  );
  const [qualification, setQualification] =
    useState<QualificationState>(initialQualification);
  const [qualificationNotes, setQualificationNotes] = useState("");
  const [repNotes, setRepNotes] = useState("");
  const [objection, setObjection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const checkedCount = checklist.filter((item) => item.checked).length;

  function updateChecklistItem(
    id: string,
    patch: Partial<Pick<DiscoveryChecklistItem, "checked" | "notes">>,
  ) {
    setChecklist((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function refreshGuidance() {
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(`/api/calls/${callId}/guidance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repNotes: repNotes.trim() || undefined,
            objection: objection.trim() || undefined,
          }),
        });
        if (!response.ok) {
          throw new Error("Unable to refresh guidance.");
        }
        const payload = (await response.json()) as { guidance: DuringCallGuidance };
        setGuidance(payload.guidance);
        setChecklist((items) =>
          syncChecklist(items, createDiscoveryChecklist(payload.guidance.checklist)),
        );
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Unable to refresh guidance.",
        );
      }
    });
  }

  return (
    <section className="space-y-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          During call
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{companyName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live guidance — checklist, objections, next-best action
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Conversation context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">Live notes (optional)</span>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              value={repNotes}
              onChange={(event) => setRepNotes(event.target.value)}
              placeholder="What you've heard so far…"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">
              Objection detected (optional)
            </span>
            <Input
              type="text"
              value={objection}
              onChange={(event) => setObjection(event.target.value)}
              placeholder="e.g. too expensive, bad timing"
            />
          </label>
          <Button type="button" onClick={refreshGuidance} disabled={isPending}>
            {isPending ? "Refreshing…" : "Refresh guidance"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Script cue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{guidance.scriptCue}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Discovery checklist</CardTitle>
          <p className="text-xs text-muted-foreground">
            {checkedCount}/{checklist.length} covered
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item.id} className="space-y-2 rounded-lg border p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border"
                    checked={item.checked}
                    onChange={(event) =>
                      updateChecklistItem(item.id, { checked: event.target.checked })
                    }
                  />
                  <span>{item.label}</span>
                </label>
                <Input
                  type="text"
                  value={item.notes}
                  onChange={(event) =>
                    updateChecklistItem(item.id, { notes: event.target.value })
                  }
                  placeholder="Fill in what you learned…"
                  aria-label={`Notes for ${item.label}`}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next-best question</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{guidance.nextBestQuestion}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next-best action</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{guidance.nextBestAction}</p>
          </CardContent>
        </Card>
      </div>

      {guidance.objectionReframe ? (
        <Card className="border-ai/30">
          <CardHeader>
            <CardTitle>Suggested reframe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{guidance.objectionReframe}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Qualification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{guidance.qualificationPrompt}</p>
          <fieldset>
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
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="qualification"
                      value={option.value}
                      checked={selected}
                      onChange={() => setQualification(option.value)}
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
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">Why this qualification?</span>
            <textarea
              className="flex min-h-[64px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
              value={qualificationNotes}
              onChange={(event) => setQualificationNotes(event.target.value)}
              placeholder="Budget, timeline, authority, need…"
            />
          </label>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Current: <span className="font-medium text-foreground">{qualification}</span>
            {qualificationNotes.trim() ? ` — ${qualificationNotes.trim()}` : null}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function syncChecklist(
  current: DiscoveryChecklistItem[],
  next: DiscoveryChecklistItem[],
): DiscoveryChecklistItem[] {
  const notesByLabel = new Map(
    current.map((item) => [item.label, { checked: item.checked, notes: item.notes }]),
  );
  return next.map((item) => {
    const prior = notesByLabel.get(item.label);
    return prior ? { ...item, ...prior } : item;
  });
}
