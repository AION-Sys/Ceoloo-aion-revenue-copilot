"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CallOutcome, ObjectionRecord, QualificationState } from "@/lib/sales/types";

type PostCallOutcomeFormProps = {
  callId: string;
  companyName: string;
  leadId: string;
  initialOutcome?: CallOutcome;
};

const QUALIFICATION_OPTIONS: { value: QualificationState; label: string }[] = [
  { value: "unqualified", label: "Unqualified" },
  { value: "exploring", label: "Exploring" },
  { value: "qualified", label: "Qualified" },
  { value: "disqualified", label: "Disqualified" },
];

function emptyObjection(): ObjectionRecord {
  return { objection: "", resolved: false };
}

export function PostCallOutcomeForm({
  callId,
  companyName,
  leadId,
  initialOutcome,
}: PostCallOutcomeFormProps) {
  const router = useRouter();
  const [qualification, setQualification] = useState<QualificationState>(
    initialOutcome?.qualification ?? "exploring",
  );
  const [painPoints, setPainPoints] = useState<string[]>(
    initialOutcome?.painPoints.length ? initialOutcome.painPoints : [""],
  );
  const [objections, setObjections] = useState<ObjectionRecord[]>(
    initialOutcome?.objections.length ? initialOutcome.objections : [emptyObjection()],
  );
  const [nextAction, setNextAction] = useState(initialOutcome?.nextAction ?? "");
  const [transcriptSummary, setTranscriptSummary] = useState(
    initialOutcome?.transcriptSummary ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [savedOutcome, setSavedOutcome] = useState<CallOutcome | null>(initialOutcome ?? null);
  const [isPending, startTransition] = useTransition();

  const readOnly = Boolean(savedOutcome);

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
        setError(submitError instanceof Error ? submitError.message : "Unable to save outcome.");
      }
    });
  }

  return (
    <section className="outcome-panel">
      <header className="brief-header">
        <p className="eyebrow">Post-call</p>
        <h1>{companyName}</h1>
        <p className="subtitle">Capture structured outcome — qualification, pains, objections, next action</p>
      </header>

      {savedOutcome ? (
        <article className="card outcome-success">
          <h2>Outcome saved</h2>
          <p className="guidance-copy">
            Call marked complete. CRM and learning wiring land in the next tasks — outcome is stored for{" "}
            {companyName}.
          </p>
          <ul>
            <li>Qualification: {savedOutcome.qualification}</li>
            <li>Next action: {savedOutcome.nextAction}</li>
            {savedOutcome.painPoints.length > 0 ? (
              <li>Pain points: {savedOutcome.painPoints.join(", ")}</li>
            ) : null}
          </ul>
          <div className="outcome-actions">
            <Link className="button button-secondary" href={`/leads/${leadId}`}>
              Back to lead brief
            </Link>
            <Link className="button" href="/">
              Workspace
            </Link>
          </div>
        </article>
      ) : null}

      <article className="card">
        <h2>Qualification</h2>
        <label className="field">
          <span>Where does this lead stand?</span>
          <select
            value={qualification}
            onChange={(event) => setQualification(event.target.value as QualificationState)}
            disabled={readOnly || isPending}
          >
            {QUALIFICATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </article>

      <article className="card">
        <h2>Pain points</h2>
        <div className="outcome-list">
          {painPoints.map((pain, index) => (
            <div className="outcome-row" key={`pain-${index}`}>
              <input
                type="text"
                value={pain}
                onChange={(event) => updatePainPoint(index, event.target.value)}
                placeholder="e.g. slow lead response"
                disabled={readOnly || isPending}
              />
              {!readOnly && painPoints.length > 1 ? (
                <button
                  className="button button-secondary button-compact"
                  type="button"
                  onClick={() => removePainPoint(index)}
                  disabled={isPending}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {!readOnly ? (
          <button
            className="button button-secondary button-compact"
            type="button"
            onClick={addPainPoint}
            disabled={isPending}
          >
            Add pain point
          </button>
        ) : null}
      </article>

      <article className="card">
        <h2>Objections</h2>
        <div className="outcome-list">
          {objections.map((item, index) => (
            <div className="outcome-objection" key={`objection-${index}`}>
              <label className="field">
                <span>Objection</span>
                <input
                  type="text"
                  value={item.objection}
                  onChange={(event) => updateObjection(index, { objection: event.target.value })}
                  placeholder="e.g. too expensive"
                  disabled={readOnly || isPending}
                />
              </label>
              <label className="field outcome-checkbox">
                <input
                  type="checkbox"
                  checked={item.resolved}
                  onChange={(event) => updateObjection(index, { resolved: event.target.checked })}
                  disabled={readOnly || isPending}
                />
                <span>Resolved on call</span>
              </label>
              <label className="field">
                <span>Suggested reframe (optional)</span>
                <input
                  type="text"
                  value={item.suggestedReframe ?? ""}
                  onChange={(event) =>
                    updateObjection(index, { suggestedReframe: event.target.value })
                  }
                  disabled={readOnly || isPending}
                />
              </label>
              {!readOnly && objections.length > 1 ? (
                <button
                  className="button button-secondary button-compact"
                  type="button"
                  onClick={() => removeObjection(index)}
                  disabled={isPending}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {!readOnly ? (
          <button
            className="button button-secondary button-compact"
            type="button"
            onClick={addObjection}
            disabled={isPending}
          >
            Add objection
          </button>
        ) : null}
      </article>

      <article className="card">
        <h2>Next action</h2>
        <label className="field">
          <span>What happens next with this lead?</span>
          <input
            type="text"
            value={nextAction}
            onChange={(event) => setNextAction(event.target.value)}
            placeholder="e.g. send proposal by Friday"
            required
            disabled={readOnly || isPending}
          />
        </label>
      </article>

      <article className="card">
        <h2>Call summary (optional)</h2>
        <label className="field">
          <span>Transcript or notes summary</span>
          <textarea
            rows={4}
            value={transcriptSummary}
            onChange={(event) => setTranscriptSummary(event.target.value)}
            placeholder="Key takeaways from the conversation…"
            disabled={readOnly || isPending}
          />
        </label>
      </article>

      {!readOnly ? (
        <div className="outcome-actions">
          <Link className="button button-secondary" href={`/calls/${callId}`}>
            Back to live call
          </Link>
          <button
            className="button"
            type="button"
            onClick={submitOutcome}
            disabled={isPending || !nextAction.trim()}
          >
            {isPending ? "Saving…" : "Save outcome & complete call"}
          </button>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
