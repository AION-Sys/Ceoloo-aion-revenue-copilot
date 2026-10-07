# Validation — Mission 002

## Status
NOT STARTED — Product Lab stage: **MVP → Validation**

## Purpose
Mission 002 is not validated at deploy. This document collects evidence that the copilot improves the sales workflow on **real prospect conversations**.

Product Lab classification and MVP definition: [`PRODUCT_LAB.md`](./PRODUCT_LAB.md).

## Product Lab posture
The intelligence + UI foundation is ahead of real-world proof. **Do not expand features** to close Mission 002. Prove the loop with real AION sales activity first.

## Validation Gates (from Mission 002)

| Gate | Criterion | Status | Evidence |
|------|-----------|--------|----------|
| Revenue | Product used on real prospect conversations | [ ] | |
| Validation | Evidence that workflow improves sales process | [ ] | |

## Gate A — Internal pilot (immediate)

**Target:** 5 real eligible call sessions (includes follow-up / no-contact scenarios).

| Criterion | Pass when | Status |
|-----------|-----------|--------|
| Eligible sessions | ≥5 real AION sales conversations recorded | [ ] |
| Scenario coverage | Includes at least one follow-up and one no-contact outcome | [ ] |
| Durability | Session survives refresh/restart without losing outcome state | [ ] |
| Outcome fidelity | Outcomes recorded correctly (stage, next action, qualification) | [ ] |
| Draft vs action | Drafts/approvals clearly distinguished from externally confirmed CRM writes | [ ] |
| Synthetic separation | No synthetic/demo activity mutated a real client record | [ ] |

## Gate B — Commercial validation (mission-complete target)

**Target:** ~25 real sales conversations.

| Criterion | Target | Status |
|-----------|--------|--------|
| Conversation volume | ≥25 real eligible sessions | [ ] |
| Extracted-fact accuracy | ≥85% on explicit facts | [ ] |
| Intervention usefulness | ≥60% judged useful / acted upon | [ ] |
| Stage advancement | ≥10 positive stage-advancement events | [ ] |
| Downstream conversion | ≥3 meaningful conversions | [ ] |
| Lineage completeness | Recommendation → action → result traceable end-to-end | [ ] |

## Study Design

### Participants
- AION sales reps / founders using the outbound contractor / Revenue OS pipeline
- Primary user for pilot: AION sales rep / owner-operator

### Scenarios
1. **Pre-call:** Rep opens prospect; generates prep (objective, questions, gaps); records time-to-ready
2. **During-call:** Rep uses guidance for discovery, objections, next-best action (rep stays in control)
3. **Post-call:** Rep reviews structured outcome; approves or rejects proposed CRM updates; verify learning events
4. **Follow-up / no-contact:** Confirm drafts are not claimed as sent; tasks/dates recorded correctly
5. **Restart:** Mid-session refresh/restart still yields correct durable outcome state

### Signals to Capture

| Signal | Method |
|--------|--------|
| Workflow completion rate | App logs — prep → call → post → follow-up |
| Time to pre-call brief | Timestamp delta |
| Qualification capture rate | Outcomes with non-empty qualification profile |
| Draft vs confirmed action | Approval audit + external CRM IDs only when confirmed |
| Event delivery | CRM + learning ingest success |
| Intervention usefulness | Rep judgment / acted-upon flag |
| Stage movement | Funnel status before/after |
| Lineage | conversation → evidence → recommendation → decision → CRM action → outcome |
| Rep sentiment | Short interview / structured feedback |
| Manager observation | Follow-up quality and objection handling |

## Evidence Log

| Date | Lead (anonymized) | Rep | Prep | During | Post | Follow-up | Restart OK | Events OK | Draft≠Action | Notes |
|------|-------------------|-----|------|--------|------|-----------|------------|-----------|--------------|-------|
| | | | | | | | | | | |

## Findings (fill after validation)

### What worked


### What did not work


### Recommended product changes (feeds learning loop)


## Verdict
PENDING — `PASS` | `FAIL` | `PASS WITH CONDITIONS`

## CEO Sign-off
- [ ] Gate A (5-call internal pilot) evidence reviewed
- [ ] Gate B (commercial validation) evidence reviewed — or deferred with conditions
- [ ] Validation evidence reviewed for Mission 002 close
- [ ] Mission 002 may close
- [ ] Mission 003 unblocked (if PASS)
