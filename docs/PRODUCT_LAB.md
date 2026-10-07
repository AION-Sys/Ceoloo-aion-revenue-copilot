# Product Lab — Revenue Copilot MVP

## Classification
**MVP → Validation**

| Field | Value |
|-------|--------|
| Lifecycle | MVP / controlled internal pilot |
| Mission | [MISSION-002](https://github.com/AION-Sys/aion-software-factory/blob/main/missions/MISSION-002.md) |
| Primary user | AION sales rep / owner-operator (first) |
| Later buyer | SMB sales teams, contractors, home-service businesses, revenue leaders with inconsistent follow-up |
| Next product gate | Real-call evidence before broader commercialization |
| Feature posture | **UI frozen** — make intelligence real; do not expand screens |
| Finish-line plan | [`plans/mvp-intelligence-finish-line.md`](./plans/mvp-intelligence-finish-line.md) |

## Product promise
Revenue Copilot gives a sales rep the right context before a conversation, intelligent guidance during it, and a governed next action afterward — while continuously learning what actually moves opportunities forward.

## Problem
Sales reps lose deals because context is scattered, discovery is inconsistent, objections aren’t handled systematically, follow-up gets missed, CRM data is incomplete, and nobody learns from previous calls.

## Core workflow
**Prepare → Call → Capture → Analyze → Follow Up → Learn**

| Phase | What the Copilot does |
|-------|------------------------|
| Before | Open the prospect; surface lead source, prior activity, business context, missing qualification data, likely pains, recommended questions, and a clear conversation objective |
| During | Interpret conversation; surface discovery gaps, objections, suggested responses, buying signals, commitments, stage/sentiment, qualification gaps, and an evidence-backed next-best action. Rep stays in control |
| After | Structured sales record: summary, facts, objections, pains, qualification, funnel stage, outcome, next action/date, follow-up draft, tasks, reviewable CRM changes, learning events |

## Sales funnel (canonical)
Lead → Business Audit → Diagnosis → Qualified Opportunity → Scope → Proposal → Closed Won → Onboarding

## MVP screens (tight UI)

Primary nav is the command cockpit only — not a light CRM shell.

| # | Screen | Route |
|---|--------|-------|
| 1 | Today / Command Center | `/dashboard` |
| 2 | Prospect Workspace | `/prospects`, `/prospects/[id]` |
| 3 | Call Prep | `/prospects/[id]/prep` |
| 4 | Live Call Workspace | `/calls/[callId]/live` |
| 5 | Post-Call Review | `/calls/[callId]/review` |
| 6 | Follow-Up Workspace | `/follow-up` |
| 7 | Learning / Performance | `/learning` |

UI plan: [`docs/plans/mvp-command-center-cockpit.md`](./plans/mvp-command-center-cockpit.md).

**UI freeze (2026-10-07):** The seven screens already express the Product Lab loop. Do not add major dashboards, autonomous SDR, or CRM-clone surfaces. Next work makes the intelligence behind these screens stateful, measurable, and production-connected — see finish-line plan.

## Redefined MVP acceptance test

One AION rep can take a **real** prospect from Lead → Call Prep → Discovery → Diagnosis → Qualified Opportunity → Follow-Up using Revenue Copilot, while the system captures evidence, recommends actions, persists **approved** CRM changes, and records whether its recommendations helped move the opportunity forward.

## Development priority (after UI scaffold)

| Priority | Focus |
|----------|--------|
| **P0** | Real prospect + production CRM path · structured qualification engine · reliable post-call extraction · governed CRM persistence · follow-up approval · outcome/intervention tracking |
| **P1** | Live transcription · dynamic objection/buying-signal detection · economic-impact calculator · smarter next-best-action |
| **P2** | Proposal generation · scheduling · email/SMS execution · pipeline analytics · coaching · multi-user |
| **Deferred** | Autonomous outbound · AI calling · broad integrations · agent builder · autonomous closing |

## Canonical data
Operate on AION’s revenue model — not a disconnected CRM:

`revenue_leads` · `contacts` · `deals` · `activities` · `discovery_calls` · `proposals` · `outcomes` · `events`

Every meaningful recommendation should eventually be traceable:

**conversation → evidence → recommendation → rep decision → CRM action → outcome**

Interventions should eventually carry stable ids so Learning can measure: recommendation → rep used → prospect response → stage delta → revenue.

## Architecture (intended)

```
Next.js 15 + TypeScript + shadcn/ui
  → Revenue Copilot domain layer
  → Supabase / AION canonical revenue data
  → AION Runtime / AI Gateway
  → OpenRouter / model providers
  → GHL Adapter for governed CRM actions
```

Also emit AION execution/learning events so Agent OS can track cost, interventions, outcomes, and ROI.

## Production guardrails
- Synthetic/demo activity **must not** mutate a real client record
- Production and synthetic evidence stay clearly separated
- Pilot CRM scope stays narrow: **Contact → Opportunity → Note/Task**, with human approval on writes
- Never claim something was sent, synced, or written unless externally confirmed
- Rep remains in control — no autonomous customer actions

## Explicitly not the MVP
- Autonomous SDR making calls by itself
- Giant CRM replacement
- Generic workflow builder
- Fully autonomous outbound system
- Multi-industry AI workforce platform
- “200 agents” stitched together

Those are downstream. Mission 003 stays blocked until Mission 002 validation gates pass.

## Validation posture
The **screens** are good enough to validate. The Product Lab priority is **real AION sales activity** plus P0 intelligence (qualification engine, review object, intervention outcomes) — not more UI.

| Gate | Target | Doc |
|------|--------|-----|
| Internal pilot (immediate) | 5 eligible real call sessions against the redefined acceptance test | [`VALIDATION.md`](./VALIDATION.md) · **[`validation/GATE_A_RUNBOOK.md`](./validation/GATE_A_RUNBOOK.md)** |
| Commercial validation | ~25 real conversations + accuracy / usefulness / stage / conversion / lineage criteria | [`VALIDATION.md`](./VALIDATION.md) |

## Related product docs
- [`PRD.md`](./PRD.md) — requirements and non-goals
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design and tasks
- [`DATA_MODEL.md`](./DATA_MODEL.md) — persistence contracts
- [`VALIDATION.md`](./VALIDATION.md) — evidence log and gate status
- [`validation/GATE_A_RUNBOOK.md`](./validation/GATE_A_RUNBOOK.md) — Gate A operator how-to + evidence templates
