"use client";

import { useState, useTransition } from "react";
import {
  createDiscoveryChecklist,
  QUALIFICATION_OPTIONS,
  syncDiscoveryChecklist,
  type DiscoveryChecklistItem,
} from "@/lib/intelligence/call-workspace";
import type { DuringCallGuidance } from "@/lib/intelligence/during-call";
import type { QualificationState } from "@/lib/sales/types";

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
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Unable to refresh guidance.");
        }

        const payload = (await response.json()) as { guidance: DuringCallGuidance };
        setGuidance(payload.guidance);
        setChecklist((previous) => syncDiscoveryChecklist(payload.guidance.checklist, previous));
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

      <article className="card discovery-checklist-card">
        <div className="discovery-checklist-header">
          <h2>Discovery checklist</h2>
          <p className="discovery-checklist-progress">
            {checkedCount}/{checklist.length} covered
          </p>
        </div>
        <ul className="discovery-checklist">
          {checklist.map((item) => (
            <li key={item.id} className="discovery-checklist-item">
              <label className="discovery-check-row">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) =>
                    updateChecklistItem(item.id, { checked: event.target.checked })
                  }
                />
                <span>{item.label}</span>
              </label>
              <label className="field discovery-notes-field">
                <span className="sr-only">Notes for {item.label}</span>
                <input
                  type="text"
                  value={item.notes}
                  onChange={(event) =>
                    updateChecklistItem(item.id, { notes: event.target.value })
                  }
                  placeholder="Fill in what you learned…"
                />
              </label>
            </li>
          ))}
        </ul>
      </article>

      <div className="brief-grid brief-grid-two">
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

      <article className="card qualification-card">
        <h2>Qualification</h2>
        <p className="guidance-copy">{guidance.qualificationPrompt}</p>
        <fieldset className="qualification-fieldset">
          <legend className="sr-only">Call qualification</legend>
          <div className="qualification-options" role="radiogroup" aria-label="Qualification">
            {QUALIFICATION_OPTIONS.map((option) => {
              const selected = qualification === option.value;
              return (
                <label
                  key={option.value}
                  className={`qualification-option${selected ? " is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="qualification"
                    value={option.value}
                    checked={selected}
                    onChange={() => setQualification(option.value)}
                  />
                  <span className="qualification-option-label">{option.label}</span>
                  <span className="qualification-option-description">{option.description}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <label className="field">
          <span>Why this qualification?</span>
          <textarea
            rows={2}
            value={qualificationNotes}
            onChange={(event) => setQualificationNotes(event.target.value)}
            placeholder="Budget, timeline, authority, need…"
          />
        </label>
        <p className="qualification-status" aria-live="polite">
          Current: <strong>{qualification}</strong>
          {qualificationNotes.trim() ? ` — ${qualificationNotes.trim()}` : null}
        </p>
      </article>
    </section>
  );
}
