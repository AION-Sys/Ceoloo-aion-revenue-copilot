# Gate A — Session Evidence Template

Copy this file per session (e.g. `session-01.md`) or paste a row into [`../../VALIDATION.md`](../../VALIDATION.md).  
Anonymize the prospect (code / initials only).

## Identity

| Field | Value |
|-------|-------|
| Session id | `GA-YYYYMMDD-##` |
| Date (UTC or local + TZ) | |
| Rep | |
| Operator | |
| Lead code (anonymized) | |
| Environment | production / pilot / demo *(demo does not count for CRM claims)* |
| Call id (app) | |
| Lead id (app) | |

## Scenario tags (check all that apply)

- [ ] Discovery / first conversation
- [ ] Follow-up commitment recorded
- [ ] No-contact / no meaningful conversation
- [ ] Durability probe (refresh/restart) performed
- [ ] CRM proposal approved
- [ ] CRM write externally confirmed (has provider id)
- [ ] Intervention usefulness marked

## Funnel snapshot

| | Stage | Qualification | Next action |
|--|-------|---------------|-------------|
| **Before** | | | |
| **After** | | | |

## Loop checklist

| Step | Done | Notes / defects |
|------|------|-----------------|
| Prep opened; objective + gaps visible | [ ] | |
| Economic impact prompted or quantified | [ ] | |
| Live: discovery gaps checked | [ ] | |
| Live: next-best action shown | [ ] | |
| Live: intervention Used / Useful marked | [ ] | Intervention id(s): |
| Review: outcome saved (qual + next action) | [ ] | |
| Review: Copilot review object visible | [ ] | |
| CRM proposals left draft until intentional approve | [ ] | |
| Follow-up draft ≠ sent without confirm id | [ ] | |
| Learning: intervention retained / visible | [ ] | |

## Gate A probes

| Probe | Result | Evidence |
|-------|--------|----------|
| Restart / refresh durability | pass / fail / n/a | |
| Draft ≠ confirmed CRM | pass / fail / n/a | External id if confirmed: |
| Synthetic separation | pass / fail | See [`SYNTHETIC_SEPARATION_CHECKLIST.md`](./SYNTHETIC_SEPARATION_CHECKLIST.md) |

## Intervention usefulness (if any)

| Intervention id | Kind | Rep used? | Useful? | Prospect response (short) |
|-----------------|------|-----------|---------|---------------------------|
| | | yes / no / ? | yes / no / ? | |

## Outcome fidelity attestation

- [ ] Qualification matches what the rep believes happened
- [ ] Next action is concrete and accurate
- [ ] Stage movement (if any) is justified by evidence on the call
- [ ] No fabricated economic impact / ROI

## Eligible for Gate A count?

- [ ] **Yes** — meets eligibility rules in [`../GATE_A_RUNBOOK.md`](../GATE_A_RUNBOOK.md)
- [ ] **No** — reason:

## Operator notes


## VALIDATION.md log row (paste)

| Date | Lead (anonymized) | Rep | Prep | During | Post | Follow-up | Restart OK | Events OK | Draft≠Action | Notes |
|------|-------------------|-----|------|--------|------|-----------|------------|-----------|--------------|-------|
| | | | | | | | | | | |
