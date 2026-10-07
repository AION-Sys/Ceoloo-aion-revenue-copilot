# Gate A Operator Runbook — Internal Pilot

## Status
READY FOR OPERATORS — Product Lab Gate A (5 eligible real call sessions)

## Purpose
Run the Mission 002 internal pilot so CEO can sign Gate A from **evidence**, not more product build.

Parent log: [`../VALIDATION.md`](../VALIDATION.md)  
Finish-line: [`../plans/mvp-intelligence-finish-line.md`](../plans/mvp-intelligence-finish-line.md)

## Pass bar (copy from VALIDATION.md)

| Criterion | Pass when |
|-----------|-----------|
| Eligible sessions | ≥5 real AION sales conversations recorded |
| Scenario coverage | ≥1 follow-up outcome **and** ≥1 no-contact outcome |
| Durability | Session survives refresh/restart without losing outcome state |
| Outcome fidelity | Stage, next action, qualification recorded correctly |
| Draft vs action | Drafts/approvals clearly ≠ externally confirmed CRM writes |
| Synthetic separation | No demo/synthetic activity mutated a real client record |

**Acceptance narrative:** One AION rep takes a real prospect Lead → Prep → Discovery → Diagnosis → Qualified Opportunity → Follow-Up while Revenue Copilot captures evidence, recommends actions, persists approved CRM changes, and records whether recommendations helped progression.

## Who does what

| Role | Responsibility |
|------|----------------|
| **Operator / QA** | Schedules sessions, fills evidence templates, updates VALIDATION.md log, flags blockers |
| **Rep** | Runs real prospect conversations in the cockpit; marks intervention Used / Useful |
| **CEO** | Reviews Gate A scorecard + evidence pack; signs VALIDATION.md |

## Preflight (once per pilot day)

1. Confirm environment is **production or pilot**, not demo-only:
   - Real Supabase org for the rep
   - Demo auth (`rep@demo.local`) **must not** write to production CRM
2. Confirm CRM path: GHL Adapter (or equivalent) approval-gated; drafts stay drafts until external confirmation IDs exist
3. Print or open templates:
   - [`templates/SESSION_EVIDENCE.md`](./templates/SESSION_EVIDENCE.md) — one per session
   - [`templates/REP_FEEDBACK.md`](./templates/REP_FEEDBACK.md) — optional short post-session
   - [`templates/GATE_A_SCORECARD.md`](./templates/GATE_A_SCORECARD.md) — rollup after ≥5
   - [`templates/SYNTHETIC_SEPARATION_CHECKLIST.md`](./templates/SYNTHETIC_SEPARATION_CHECKLIST.md) — before any CRM confirm
4. Anonymize prospect names in evidence (company initials / code only in the public log)

## Session loop (repeat until ≥5 eligible)

Use the frozen 7-screen loop only — **do not** ask for new screens mid-pilot.

| Step | Screen | Operator checks |
|------|--------|-----------------|
| 1 | **Today** (`/dashboard`) | Prospect appears; priority reason is data-backed when available |
| 2 | **Prospect** (`/prospects/[id]`) | Stage before call noted on session template |
| 3 | **Call Prep** (`/prospects/[id]/prep`) | Objective, gaps, economic-impact prompt or estimate present; time-to-ready noted |
| 4 | **Live** (`/calls/[callId]/live`) | Discovery checklist used; next-best action + objection reframe shown; mark **Used / Useful** on interventions when possible |
| 5 | **Review** (`/calls/[callId]/review`) | Structured outcome saved; Copilot review object visible; CRM proposals remain **draft** until approved |
| 6 | **Follow-Up** (`/follow-up`) | Draft stay unsent until confirmed; no “sent” claim without provider id |
| 7 | **Learning** (`/learning`) | Intervention id + usefulness visible for this call when retained |

### Required scenario mix across the 5

- [ ] At least one session ends in a **follow-up** commitment (date/task clear)
- [ ] At least one session ends in **no-contact** / no meaningful conversation (still record outcome honestly)
- [ ] At least one session includes a **refresh/restart** mid-flow (see Durability below)

### Durability probe (at least once)

1. Mid-call or mid-review: refresh the browser (or soft restart)
2. Confirm outcome form / CRM drafts / stage still match what was saved
3. Record result on the session template (`Restart OK: yes/no`)

### Draft ≠ confirmed probe (every CRM-touching session)

1. Approve a CRM proposal **only if** the rep intends a real write
2. Confirm only when an **external confirmation id** exists
3. Screenshot or note: proposal evidence state before/after (`draft` → `approved` → `confirmed`)
4. If unsure, leave as draft — **fail the session for Gate A CRM claims**, not production data

## Eligibility rules

A session **counts** toward Gate A when all are true:

- Real AION sales activity (not synthetic demo lead as production)
- Prospect is a real or intentionally pilot-eligible account (document which)
- Outcome saved with qualification + next action
- Operator filled [`SESSION_EVIDENCE.md`](./templates/SESSION_EVIDENCE.md)

A session **does not count** when:

- Demo-only path used against production CRM
- Outcome missing or fabricated
- Operator cannot attest draft≠confirmed for CRM claims made in notes

## After each session

1. Complete SESSION_EVIDENCE (copy row into [`../VALIDATION.md`](../VALIDATION.md) Evidence Log)
2. Optionally complete REP_FEEDBACK
3. Note intervention usefulness (`useful` / `rep_used`) from Learning or Live
4. File blockers as product issues **only if** they block Gate A criteria — prefer evidence over feature requests

## Closing Gate A

When ≥5 eligible sessions are logged:

1. Fill [`GATE_A_SCORECARD.md`](./templates/GATE_A_SCORECARD.md)
2. Tick Gate A criteria in [`../VALIDATION.md`](../VALIDATION.md)
3. Attach or link anonymized session templates for CEO review
4. CEO sign-off checklist in VALIDATION.md

**Do not** open Mission 003 product work while Gate A is open.

## Out of scope during Gate A

- New dashboards / nav destinations
- Autonomous calling / SDR
- CRM replacement / GHL clone features
- Live STT / transcription as a blocker (P1 — after Gate A is in motion or CEO waives)

## Quick links

| Artifact | Path |
|----------|------|
| Evidence log | [`../VALIDATION.md`](../VALIDATION.md) |
| Session template | [`templates/SESSION_EVIDENCE.md`](./templates/SESSION_EVIDENCE.md) |
| Scorecard | [`templates/GATE_A_SCORECARD.md`](./templates/GATE_A_SCORECARD.md) |
| Rep feedback | [`templates/REP_FEEDBACK.md`](./templates/REP_FEEDBACK.md) |
| Synthetic checklist | [`templates/SYNTHETIC_SEPARATION_CHECKLIST.md`](./templates/SYNTHETIC_SEPARATION_CHECKLIST.md) |
| Cockpit screens | Today · Prospect · Prep · Live · Review · Follow-Up · Learning |
