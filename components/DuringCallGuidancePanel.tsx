"use client";

import { useState, useTransition } from "react";
import type { DuringCallGuidance } from "@/lib/intelligence/during-call";

type DuringCallGuidancePanelProps = {
  callId: string;
  companyName: string;
  initialGuidance: DuringCallGuidance;
};

export function DuringCallGuidancePanel({
  callId,
  companyName,
  initialGuidance,
}: DuringCallGuidancePanelProps) {
  const [guidance, setGuidance] = useState(initialGuidance);
  const [repNotes, setRepNotes] = useState("");
  const [objection, setObjection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Unable to refresh guidance.");
        }

        const payload = (await response.json()) as { guidance: DuringCallGuidance };
        setGuidance(payload.guidance);
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh guidance.");
      }
    });
  }

  return (
    <section className="guidance-panel">
      <header className="brief-header">
        <p className="eyebrow">During call</p>
        <h1>{companyName}</h1>
        <p className="subtitle">Live guidance — checklist, objections, next-best action</p>
      </header>

      <article className="card guidance-inputs">
        <h2>Conversation context</h2>
        <label className="field">
          <span>Live notes (optional)</span>
          <textarea
            rows={3}
            value={repNotes}
            onChange={(event) => setRepNotes(event.target.value)}
            placeholder="What you've heard so far…"
          />
        </label>
        <label className="field">
          <span>Objection detected (optional)</span>
          <input
            type="text"
            value={objection}
            onChange={(event) => setObjection(event.target.value)}
            placeholder="e.g. too expensive, bad timing"
          />
        </label>
        <button className="button" type="button" onClick={refreshGuidance} disabled={isPending}>
          {isPending ? "Refreshing…" : "Refresh guidance"}
        </button>
        {error ? <p className="form-error">{error}</p> : null}
      </article>

      <article className="card">
        <h2>Script cue</h2>
        <p className="guidance-copy">{guidance.scriptCue}</p>
      </article>

      <div className="brief-grid">
        <article className="card">
          <h2>Discovery checklist</h2>
          <ul>
            {guidance.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Next-best question</h2>
          <p className="guidance-copy">{guidance.nextBestQuestion}</p>
        </article>

        <article className="card">
          <h2>Next-best action</h2>
          <p className="guidance-copy">{guidance.nextBestAction}</p>
        </article>
      </div>

      {guidance.objectionReframe ? (
        <article className="card guidance-highlight">
          <h2>Suggested reframe</h2>
          <p className="guidance-copy">{guidance.objectionReframe}</p>
        </article>
      ) : null}

      <article className="card">
        <h2>Qualification</h2>
        <p className="guidance-copy">{guidance.qualificationPrompt}</p>
      </article>
    </section>
  );
}
