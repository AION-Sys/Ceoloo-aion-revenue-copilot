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
| Feature posture | Prove the loop — do not expand scope |

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

1. **Today / Command Center** — priority prospects, follow-ups, pipeline movement, overdue tasks, recommended actions
2. **Prospect Workspace** — company/contact context, interaction history, stage, qualification fields, known pains
3. **Call Prep** — objective, questions, missing information, likely objections, recommended positioning
4. **Live Call Workspace** — transcript/context, discoveries, objections, suggested responses, commitments, next-best action
5. **Post-Call Review** — AI summary, extracted facts, outcome, funnel movement, next step, proposed CRM updates
6. **Follow-Up Workspace** — approved email/message draft, task/date, proposal or next-meeting recommendation
7. **Learning / Performance** — interventions that worked, outcomes, stage movement, rep corrections, conversion signals

## Canonical data
Operate on AION’s revenue model — not a disconnected CRM:

`revenue_leads` · `contacts` · `deals` · `activities` · `discovery_calls` · `proposals` · `outcomes` · `events`

Every meaningful recommendation should eventually be traceable:

**conversation → evidence → recommendation → rep decision → CRM action → outcome**

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
Intelligence + UI foundation is ahead of real-world proof. The Product Lab priority is **real AION sales activity**, not more features.

| Gate | Target | Doc |
|------|--------|-----|
| Internal pilot (immediate) | 5 eligible real call sessions | [`VALIDATION.md`](./VALIDATION.md) |
| Commercial validation | ~25 real conversations + accuracy / usefulness / stage / conversion / lineage criteria | [`VALIDATION.md`](./VALIDATION.md) |

## Related product docs
- [`PRD.md`](./PRD.md) — requirements and non-goals
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design and tasks
- [`DATA_MODEL.md`](./DATA_MODEL.md) — persistence contracts
- [`VALIDATION.md`](./VALIDATION.md) — evidence log and gate status
