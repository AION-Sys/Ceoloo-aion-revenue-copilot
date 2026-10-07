"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { InterventionFeedback } from "@/components/cockpit/InterventionFeedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type {
  BuyingSignal,
  Commitment,
  TranscriptCaptureLine,
} from "@/lib/cockpit/types";
import {
  createDiscoveryChecklist,
  syncDiscoveryChecklist,
  type DiscoveryChecklistItem,
} from "@/lib/intelligence/call-workspace";
import type { DuringCallGuidance } from "@/lib/intelligence/during-call";
import type { BusinessContext, Lead } from "@/lib/sales/types";
import { cn } from "@/lib/utils";

type LiveCallWorkspaceProps = {
  callId: string;
  lead: Lead;
  context: BusinessContext;
  guidance: DuringCallGuidance;
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function discoveryStorageKey(callId: string) {
  return `aion-live-discovery-checklist:${callId}`;
}

function readStoredChecklist(callId: string): DiscoveryChecklistItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(discoveryStorageKey(callId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiscoveryChecklistItem[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredChecklist(callId: string, items: DiscoveryChecklistItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(discoveryStorageKey(callId), JSON.stringify(items));
  } catch {
    // ignore quota / private mode
  }
}

export function LiveCallWorkspace({
  callId,
  lead,
  context,
  guidance,
}: LiveCallWorkspaceProps) {
  const seedTranscript = useMemo<TranscriptCaptureLine[]>(
    () => [
      {
        id: "seed-1",
        speaker: "Rep",
        text:
          guidance.scriptCue.slice(0, 180) ||
          "Thanks for taking the call — what prompted you to look at this now?",
        captureMode: "demo_fixture",
      },
    ],
    [guidance.scriptCue],
  );

  const [transcript, setTranscript] = useState(seedTranscript);
  const [draftSpeaker, setDraftSpeaker] = useState<"Rep" | "Prospect">("Prospect");
  const [draftText, setDraftText] = useState("");
  const [buyingSignals, setBuyingSignals] = useState<BuyingSignal[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [signalDraft, setSignalDraft] = useState("");
  const [commitmentDraft, setCommitmentDraft] = useState("");
  const [discoveryGaps, setDiscoveryGaps] = useState<DiscoveryChecklistItem[]>(() =>
    createDiscoveryChecklist(guidance.checklist),
  );
  const [checklistReady, setChecklistReady] = useState(false);

  useEffect(() => {
    const stored = readStoredChecklist(callId);
    const next = stored
      ? syncDiscoveryChecklist(guidance.checklist, stored)
      : createDiscoveryChecklist(guidance.checklist);
    setDiscoveryGaps(next);
    setChecklistReady(true);
  }, [callId, guidance.checklist]);

  useEffect(() => {
    if (!checklistReady) return;
    writeStoredChecklist(callId, discoveryGaps);
  }, [callId, discoveryGaps, checklistReady]);

  const coveredGaps = discoveryGaps.filter((item) => item.checked).length;

  const readiness = Math.min(
    95,
    35 +
      coveredGaps * 6 +
      buyingSignals.length * 8 +
      commitments.length * 10 +
      Math.max(0, transcript.length - 1) * 3,
  );

  function toggleDiscoveryGap(id: string, checked: boolean) {
    setDiscoveryGaps((items) =>
      items.map((item) => (item.id === id ? { ...item, checked } : item)),
    );
  }

  function addTranscriptLine() {
    const text = draftText.trim();
    if (!text) return;
    setTranscript((current) => [
      ...current,
      {
        id: createId("line"),
        speaker: draftSpeaker,
        text,
        captureMode: "rep_entered",
      },
    ]);
    setDraftText("");
  }

  function addBuyingSignal() {
    const text = signalDraft.trim();
    if (!text) return;
    setBuyingSignals((current) => [
      ...current,
      {
        id: createId("signal"),
        text,
        strength: "moderate",
        source: "rep_capture",
      },
    ]);
    setSignalDraft("");
  }

  function addCommitment() {
    const text = commitmentDraft.trim();
    if (!text) return;
    setCommitments((current) => [
      ...current,
      {
        id: createId("commit"),
        text,
        owner: "prospect",
      },
    ]);
    setCommitmentDraft("");
  }

  return (
    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
      <aside className="hidden min-h-0 flex-col rounded-xl border bg-card lg:flex">
        <div className="border-b p-3">
          <p className="text-xs text-muted-foreground">Prospect</p>
          <h2 className="mt-1 text-sm font-semibold">
            {lead.contactName ?? "Unknown contact"}
          </h2>
          <p className="text-xs text-muted-foreground">{lead.companyName}</p>
        </div>
        <ScrollArea className="flex-1 p-3">
          <section className="space-y-3">
            <div>
              <p className="text-xs font-semibold">Company snapshot</p>
              <dl className="mt-2 space-y-1.5 text-xs">
                <Row label="Industry" value={context.industry} />
                <Row label="Systems" value={context.existingSystems.join(", ") || "—"} />
                <Row label="Source" value={lead.source ?? "—"} />
                <Row label="AION service" value={context.recommendedService ?? "—"} />
              </dl>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-semibold">Known pains</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {context.workflowProblems.length ? (
                  context.workflowProblems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))
                ) : (
                  <li>None recorded</li>
                )}
              </ul>
            </div>
          </section>
        </ScrollArea>
      </aside>

      <section className="flex min-h-0 flex-col rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold">{lead.contactName ?? lead.companyName}</p>
            <p className="text-xs text-muted-foreground">
              Live call workspace · rep-captured notes (not live STT)
            </p>
          </div>
          <Badge variant="secondary">Capture mode: manual</Badge>
        </div>
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {transcript.map((line) => (
              <div key={line.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      line.speaker === "Rep" ? "text-ai" : "text-foreground",
                    )}
                  >
                    {line.speaker}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {line.captureMode === "rep_entered" ? "rep entered" : "demo seed"}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">{line.text}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="space-y-2 border-t p-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={draftSpeaker === "Rep" ? "secondary" : "outline"}
              onClick={() => setDraftSpeaker("Rep")}
            >
              Rep
            </Button>
            <Button
              type="button"
              size="sm"
              variant={draftSpeaker === "Prospect" ? "secondary" : "outline"}
              onClick={() => setDraftSpeaker("Prospect")}
            >
              Prospect
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              placeholder="Capture what was said…"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTranscriptLine();
                }
              }}
            />
            <Button type="button" size="sm" onClick={addTranscriptLine}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Do not claim live transcription unless an external STT provider is confirmed.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={`/calls/${callId}/review`}>End & review</Link>
            </Button>
          </div>
        </div>
      </section>

      <aside className="flex min-h-0 flex-col rounded-xl border border-ai/20 bg-card">
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Next-best action</p>
              <p className="mt-1 text-sm font-medium leading-snug">
                {guidance.nextBestAction}
              </p>
              {guidance.interventions?.find((i) => i.kind === "next_best_action") ? (
                <InterventionFeedback
                  className="mt-2"
                  compact
                  interventionId={
                    guidance.interventions.find((i) => i.kind === "next_best_action")!
                      .interventionId
                  }
                />
              ) : null}
              {guidance.copilotPolicy ? (
                <div
                  className={cn(
                    "mt-2 rounded-md border px-2 py-1.5 text-[11px] leading-snug",
                    guidance.copilotPolicy.allowPitch
                      ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                      : "border-amber-500/30 bg-amber-500/5 text-foreground",
                  )}
                >
                  <p className="font-semibold">
                    {guidance.copilotPolicy.allowPitch ? "Pitch allowed" : "Do not pitch"}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {guidance.copilotPolicy.confirmed}/{guidance.copilotPolicy.total} confirmed
                    </span>
                  </p>
                  <p className="mt-0.5 text-muted-foreground">{guidance.copilotPolicy.rationale}</p>
                  <p className="mt-1 text-foreground/90">
                    Ask: {guidance.nextBestQuestion}
                  </p>
                </div>
              ) : null}

              <div className="mt-3 rounded-lg border border-border/80 bg-muted/20 p-2.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Discovery gaps</p>
                  <p className="text-[11px] text-muted-foreground" aria-live="polite">
                    {coveredGaps}/{discoveryGaps.length} covered
                  </p>
                </div>
                <ul className="space-y-1.5" aria-label="Discovery gaps checklist">
                  {discoveryGaps.map((item) => (
                    <li key={item.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-xs leading-snug transition-colors hover:bg-background/70",
                          item.checked && "text-muted-foreground line-through",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-3.5 shrink-0 rounded border border-input accent-primary"
                          checked={item.checked}
                          onChange={(event) =>
                            toggleDiscoveryGap(item.id, event.target.checked)
                          }
                          aria-label={item.label}
                        />
                        <span>{item.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold">Objection / reframe</p>
              {guidance.objectionReframe ? (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {guidance.objectionReframe}
                  </p>
                  {guidance.interventions?.find((i) => i.kind === "objection_reframe") ? (
                    <InterventionFeedback
                      className="mt-2"
                      compact
                      interventionId={
                        guidance.interventions.find((i) => i.kind === "objection_reframe")!
                          .interventionId
                      }
                    />
                  ) : null}
                </>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Capture an objection in notes, then refresh guidance from the call panel.
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold">Buying signals</p>
              <ul className="mt-2 space-y-1.5">
                {buyingSignals.map((signal) => (
                  <li key={signal.id}>
                    <Badge variant="success">{signal.text}</Badge>
                  </li>
                ))}
                {buyingSignals.length === 0 ? (
                  <li className="text-xs text-muted-foreground">None captured yet</li>
                ) : null}
              </ul>
              <div className="mt-2 flex gap-2">
                <Input
                  value={signalDraft}
                  onChange={(event) => setSignalDraft(event.target.value)}
                  placeholder="Add buying signal"
                />
                <Button type="button" size="sm" variant="outline" onClick={addBuyingSignal}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold">Commitments</p>
              <ul className="mt-2 space-y-1.5 text-xs">
                {commitments.map((item) => (
                  <li key={item.id} className="rounded-md border px-2 py-1.5">
                    {item.text}
                  </li>
                ))}
                {commitments.length === 0 ? (
                  <li className="text-muted-foreground">None captured yet</li>
                ) : null}
              </ul>
              <div className="mt-2 flex gap-2">
                <Input
                  value={commitmentDraft}
                  onChange={(event) => setCommitmentDraft(event.target.value)}
                  placeholder="Add commitment"
                />
                <Button type="button" size="sm" variant="outline" onClick={addCommitment}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Session readiness</span>
                <span className="font-medium">{readiness}%</span>
              </div>
              <Progress value={readiness} />
            </div>
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
