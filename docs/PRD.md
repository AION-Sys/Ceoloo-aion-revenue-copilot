# PRD — AION Revenue Conversion Copilot

## Status
APPROVED — Product Lab: **MVP → Validation**

## Mission Link
[aion-software-factory: MISSION-002](https://github.com/AION-Sys/aion-software-factory/blob/main/missions/MISSION-002.md)

Product Lab classification: [`PRODUCT_LAB.md`](./PRODUCT_LAB.md)

## Product promise
Revenue Copilot gives a sales rep the right context before a conversation, intelligent guidance during it, and a governed next action afterward — while continuously learning what actually moves opportunities forward.

## Problem
Home-service contractors and SMB sales teams generate leads, but revenue leaks between initial contact and conversion. Context is scattered, discovery is inconsistent, objections aren’t handled systematically, follow-up gets missed, CRM data is incomplete, and conversations are not systematically learned from.

## Goals
- Productize AION's conversion loop: Prepare → Call → Capture → Analyze → Follow Up → Learn
- Give reps an AI-assisted workspace for pre-call, during-call, and post-call workflows
- Emit structured events for CRM persistence and AION learning infrastructure
- Validate on real prospect conversations via AION's contractor / Revenue OS outbound pipeline
- Keep every meaningful recommendation eventually traceable: conversation → evidence → recommendation → rep decision → CRM action → outcome

## Non-Goals (V1)
- Autonomous calling / autonomous SDR
- Full CRM replacement
- Generic workflow builder
- Fully autonomous outbound system
- Multi-industry AI workforce platform
- Multi-agent “200 agents” orchestration

## Users and Use Cases

| User | Use case | Success looks like |
|------|----------|-------------------|
| Sales rep / owner-operator | Prepare for a prospect call | Brief with pains, offer, gaps, and questions in &lt; 2 min |
| Sales rep | Run discovery on live call | Checklist, objection reframe, qualification captured; rep stays in control |
| Sales rep | Close out call | Structured outcome, next action, reviewable CRM + learning events |
| Sales manager | Review team usage | Evidence that workflow improves conversion signals |
| Owner/operator (later buyer) | Buy based on outcomes | Faster response, better conversations, more closed revenue |

## Requirements

### Sales motion
Reps qualify prospects for AION implementation work:

Lead → Business Audit → Diagnosis → Qualified Opportunity → Scope → Proposal → Closed Won → Onboarding.

Qualification covers current workflow/problem, business impact, existing systems/tools, automation opportunity, decision maker, implementation readiness, urgency/timeline, budget/commercial fit, and recommended AION service.

### MVP screens
1. Today / Command Center
2. Prospect Workspace
3. Call Prep
4. Live Call Workspace
5. Post-Call Review
6. Follow-Up Workspace
7. Learning / Performance

Screen intent is defined in [`PRODUCT_LAB.md`](./PRODUCT_LAB.md). Keep the UI tight; do not expand navigation into CRM-replacement surface area.

### Must Have
- Pre-call brief from lead + business context (objective, questions, missing info, likely objections)
- Qualification and agent guidance follow the AION implementation funnel above
- During-call guidance surfaces (checklist, objections, suggested responses, next-best action)
- Post-call structured outcome capture
- Reviewable / approvable CRM changes (not blind writes)
- Learning event emission on outcomes
- Clear separation of synthetic/demo evidence from production client records
- CI: lint, typecheck, tests, build

### Should Have
- Transcript/notes ingestion for post-call structuring
- Objection pattern tagging for learning worker
- Follow-up draft + task/date recommendations with explicit draft vs sent state
- Lineage fields tying recommendation → decision → CRM action → outcome

### Won't Have (V1)
- Autonomous dialer
- Custom workflow designer
- Enterprise multi-tenant admin for external customers
- Broad GHL surface beyond Contact → Opportunity → Note/Task (pilot)

## Production guardrails
- Synthetic/demo activity cannot mutate a real client record
- CRM writes require human approval; never claim send/sync/write without external confirmation
- Pilot CRM scope: Contact → Opportunity → Note/Task via GHL Adapter
- Rep remains accountable for customer-facing actions

## Acceptance Criteria
Aligned with Mission 002 — see mission file and [`VALIDATION.md`](./VALIDATION.md).

| Gate | Immediate / mission-complete |
|------|------------------------------|
| Internal pilot | 5 eligible real call sessions (incl. follow-up/no-contact), restart survival, correct outcomes, draft≠action |
| Commercial validation | ~25 conversations; ≥85% explicit-fact accuracy; ≥60% useful interventions; ≥10 stage advances; ≥3 conversions; complete lineage |

Mission complete requires **Revenue** and **Validation** gates.

## Metrics

| Metric | Target (validation) | How measured |
|--------|---------------------|--------------|
| Rep workflow completion | Reps complete prep → call → post on real leads | Usage logs + `docs/VALIDATION.md` |
| Time to pre-call brief | &lt; 2 minutes | Timed sessions |
| Outcome event rate | 100% of completed calls emit CRM + learning events (where configured) | Event ingest logs |
| Draft vs confirmed action | 100% of claimed CRM writes have external confirmation | Approval audit |
| Workflow improvement signal | Qualitative + quantitative evidence | Validation interviews + Gate A/B tables |

## Open Questions
- [ ] Supabase project provisioning — owner: CEO/infra
- [ ] AION AI Gateway model routing defaults — owner: Architect
- [ ] Learning worker contract version — owner: Architect + platform team
- [ ] Production GHL Adapter credentials + approval path for pilot writes — owner: CEO/Security

## Approval
- [x] PM complete (Mission 002)
- [x] Product Lab classification: MVP → Validation (real-call evidence is next gate)
- [ ] CEO production deploy approval (pending MVP release record)
