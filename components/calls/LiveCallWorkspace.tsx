"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Circle, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { DuringCallGuidance } from "@/lib/intelligence/during-call";
import type { BusinessContext, Lead } from "@/lib/sales/types";
import { cn } from "@/lib/utils";

const STAGES = [
  "Opening",
  "Qualification",
  "Discovery",
  "Objection",
  "Solution",
  "Commitment",
  "Close",
] as const;

type LiveCallWorkspaceProps = {
  callId: string;
  lead: Lead;
  context: BusinessContext;
  guidance: DuringCallGuidance;
};

type TranscriptLine = {
  id: string;
  speaker: "Rep" | "Prospect";
  text: string;
};

export function LiveCallWorkspace({
  callId,
  lead,
  context,
  guidance,
}: LiveCallWorkspaceProps) {
  const [seconds, setSeconds] = useState(0);
  const [stageIndex] = useState(2);
  const transcript = useMemo<TranscriptLine[]>(
    () => [
      {
        id: "1",
        speaker: "Rep",
        text:
          guidance.scriptCue.slice(0, 180) ||
          "Thanks for taking the call — what prompted you to look at this now?",
      },
      {
        id: "2",
        speaker: "Prospect",
        text: context.likelyPains[0]
          ? `We're dealing with ${context.likelyPains[0]} and need a clearer path forward.`
          : "We're evaluating options and want to understand fit before committing.",
      },
    ],
    [context.likelyPains, guidance.scriptCue],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const readiness = Math.min(95, 45 + guidance.checklist.length * 5);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
      <aside className="hidden min-h-0 flex-col rounded-xl border bg-card lg:flex">
        <div className="border-b p-3">
          <p className="text-xs text-muted-foreground">Contact</p>
          <h2 className="mt-1 text-sm font-semibold">
            {lead.contactName ?? "Unknown contact"}
          </h2>
          <p className="text-xs text-muted-foreground">{lead.companyName}</p>
        </div>
        <ScrollArea className="flex-1 p-3">
          <section className="space-y-3">
            <div>
              <p className="text-xs font-semibold">Company Snapshot</p>
              <dl className="mt-2 space-y-1.5 text-xs">
                <Row label="Industry" value={context.industry} />
                <Row label="Services" value={context.services.join(", ") || "—"} />
                <Row label="Source" value={lead.source ?? "—"} />
                <Row label="Offer" value={context.relevantOffer ?? "—"} />
              </dl>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-semibold">Previous Activity</p>
              <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                <li>Lead created · {lead.status}</li>
                <li>Pre-call brief available</li>
                <li>No prior completed call on record</li>
              </ul>
            </div>
          </section>
        </ScrollArea>
      </aside>

      <section className="flex min-h-0 flex-col rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold">{lead.contactName ?? lead.companyName}</p>
            <p className="text-xs text-muted-foreground">{lead.companyName}</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="success" className="gap-1">
              <Circle className="h-2 w-2 fill-current" />
              Connected
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Mic className="h-3 w-3" />
              Transcribing
            </Badge>
            <span className="tabular-nums font-medium">{mm}:{ss}</span>
          </div>
        </div>
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {transcript.map((line) => (
              <div key={line.id} className="space-y-1">
                <p
                  className={cn(
                    "text-xs font-medium",
                    line.speaker === "Rep" ? "text-ai" : "text-foreground",
                  )}
                >
                  {line.speaker}
                </p>
                <p className="text-sm leading-relaxed">{line.text}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Highlighted entities appear as funding, urgency, and timeline are spoken.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={`/calls/${callId}/review`}>End & review</Link>
          </Button>
        </div>
      </section>

      <aside className="flex min-h-0 flex-col rounded-xl border border-ai/20 bg-card">
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Stage</p>
              <p className="mt-1 text-sm font-semibold">{STAGES[stageIndex]}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {STAGES.map((stage, index) => (
                  <Badge
                    key={stage}
                    variant={index === stageIndex ? "ai" : "outline"}
                    className="text-[10px]"
                  >
                    {stage}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Sentiment</p>
              <p className="mt-1 text-sm font-medium">Guarded</p>
            </div>

            <div>
              <p className="text-xs font-semibold">Buying Signals</p>
              <ul className="mt-2 space-y-1.5">
                {context.likelyPains.slice(0, 4).map((pain) => (
                  <li key={pain}>
                    <Badge variant="success">{pain}</Badge>
                  </li>
                ))}
                {context.likelyPains.length === 0 ? (
                  <li className="text-xs text-muted-foreground">Listening for signals…</li>
                ) : null}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold">Objections</p>
              <div className="mt-2 space-y-2">
                {guidance.objectionReframe ? (
                  <div className="rounded-lg border p-2">
                    <p className="text-xs font-medium">Detected concern</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {guidance.objectionReframe}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">None detected yet.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold">Missing Discovery</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {guidance.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold">Next Best Action</p>
              <p className="mt-1 text-sm leading-snug">{guidance.nextBestAction}</p>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-xs font-semibold">Readiness Score</p>
                <p className="text-sm font-semibold tabular-nums">{readiness} / 100</p>
              </div>
              <Progress value={readiness} />
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>Context loaded from business profile</li>
                <li>Discovery checklist in progress</li>
                <li>Decision path still being confirmed</li>
              </ul>
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
      <dd className="text-right">{value}</dd>
    </div>
  );
}
