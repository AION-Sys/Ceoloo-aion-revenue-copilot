# Plan — MVP intelligence finish line (UI frozen)

## Status
Product direction captured from cockpit review (2026-10-07). **Freeze major UI expansion.** Make the existing 7-screen loop real, stateful, measurable, and connected to production sales activity.

## Honest inventory

| Layer | State |
|-------|--------|
| Screen loop (Today → Prep → Live → Review → Follow-Up → Learning) | **Done** — shape matches Product Lab |
| Demo / synthetic path | Present — must not mutate production CRM |
| Structured qualification *engine* (boolean state machine) | **Partial** — profile fields + % completeness UI; not a reasoning engine |
| Post-call extraction | **Manual form** — not reliable AI extraction yet |
| Governed CRM persistence | **Partial** — lead status + event_log; GHL Adapter approval path still narrow |
| Follow-up approval | **Done for drafts** — draft ≠ sent enforced in UI |
| Outcome / intervention tracking | **Partial** — stable `intervention_id` + usefulness capture + stage lineage; revenue attribution still open |
| Live transcription / dynamic detection | **Not started** (P1) |
| Economic-impact calculator | **Not started** (P1) |

## Redefined MVP acceptance test

> One AION rep can take a **real** prospect from Lead → Call Prep → Discovery → Diagnosis → Qualified Opportunity → Follow-Up using Revenue Copilot, while the system **captures evidence**, **recommends actions**, **persists approved CRM changes**, and **records whether recommendations helped move the opportunity forward**.

Pass requires Gate A evidence in [`VALIDATION.md`](../VALIDATION.md) — not more screens.

## Priority stack

### P0 — close the loop on real activity (now)

1. Real prospect + production CRM data path (demo/prod separation intact)
2. Structured qualification engine (boolean state, not only a progress bar)
3. Reliable post-call extraction → canonical review object
4. Governed CRM persistence (approved mutations only)
5. Follow-up approval (already shaped — wire to real sends only with confirmation IDs)
6. Outcome tracking (intervention identity → stage → eventual result)

### P1 — make the live Copilot dynamic

1. Live transcription (audio → speakers → structured extraction)
2. Dynamic objection / buying-signal detection (intervene on material change, not constant chatter)
3. Economic-impact calculator (leads × delay × AOV × close rate → $ exposure)
4. Smarter next-best-action engine (rules + decision adapters + recalled practices)

### P2 — commercialization surfaces (after Gate A)

Proposal generation · meeting scheduling · email/SMS execution · pipeline analytics · rep coaching · multi-user/team

### Deferred (Mission 003 / out of scope)

Autonomous outbound · AI calling · huge analytics suites · dozens of integrations · generalized agent builder · fully autonomous closing

## Design notes for P0 engines

### Qualification state machine

Behind the % bar, maintain explicit booleans (names illustrative):

`pain_confirmed` · `impact_quantified` · `current_process_known` · `systems_identified` · `decision_maker_known` · `budget_fit` · `timeline_known` · `implementation_readiness` · `service_fit` · `next_step_committed`

Copilot policy example: `confirmed < 6/10` → discovery incomplete → do not pitch → ask impact question.

### Economic impact (feeds diagnosis / proposal)

Prefer quantified exposure over vague pain:

`leads/month × delayed_share × avg_job_value × close_rate ≈ monthly_revenue_exposure`

Flow into diagnosis, ROI argument, and Learning outcomes.

### Canonical post-call review object

Single artifact after End & Review (`lib/cockpit/post-call-review.ts` → `buildPostCallReview`):

learned · evidence · qualification deltas · objections · buying signals · commitments · recommended stage · next action · follow-up · proposed CRM mutations

Rendered on `/calls/[callId]/review` via `PostCallReviewSummary`. CRM proposals and follow-up drafts are derived from this object (not rebuilt ad hoc). One approval → governed CRM ops (Contact → Opportunity → Note/Task).

### Measurable Learning

Every intervention gets a stable id and lineage fields (`lib/learning/interventions.ts`):

`intervention_id` → objection/pattern → recommendation → `rep_used` → prospect_response → stage_before/after → eventual_outcome → revenue

Minted when live guidance is shown (`callId` on `generateDuringCallGuidance`), retained as `intervention` episodes, usefulness captured on Live + Learning via `InterventionFeedback`, and closed with stage/outcome on post-call submit. Revenue stays unset until real attribution — never invent ROI.

Accumulated outcome data is the moat — UI can be copied; intervention→outcome tables cannot.

### Today Copilot recommendation (small UX, optional)

Explain *why* a prospect is priority: estimated $ · overdue follow-up · qualification % · highest-probability next action. Prefer data over vibes; no fabricated ROI.

## Explicit freeze

Do **not**:

- Add major new dashboards or nav destinations
- Build autonomous SDR / AI calling
- Expand into GHL clone / CRM replacement
- Start Mission 003 product work while Gate A is open

## Suggested implementation order (small PRs)

| # | PR theme | Depends |
|---|----------|---------|
| 1 | Qualification state engine + Copilot policy helpers | — |
| 2 | Canonical post-call review object + CRM proposal bundle | 1 |
| 3 | Intervention identity on learning retain + usefulness capture | 1–2 |
| 4 | Economic impact fields on outcome / prep | 1 |
| 5 | Gate A operator runbook + evidence templates | — |

P1 transcription starts only after Gate A is in motion (or CEO waives sequencing).

## Approval
- [ ] Human/CEO acknowledges finish-line redefinition
- [ ] Builder executes P0 PRs one at a time against this plan
