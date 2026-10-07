# Architecture — AION Revenue Conversion Copilot

## Status
APPROVED — MVP scaffold · Product Lab: **MVP → Validation**

## Mission Link
[aion-software-factory: MISSION-002](https://github.com/AION-Sys/aion-software-factory/blob/main/missions/MISSION-002.md)

Product Lab classification: [`PRODUCT_LAB.md`](./PRODUCT_LAB.md)

## Summary
Next.js sales workspace with Supabase for persistence, AION Runtime / AI Gateway for conversational intelligence, governed GHL Adapter writes for CRM actions, and AION event infrastructure for CRM + learning signals. V1 is a tight rep workflow — not a platform.

**Priority now:** prove the loop with real sales activity (`docs/VALIDATION.md`). Do not invent Mission 003 product work or expand out-of-scope surfaces.

## Sales motion

The copilot reasons with AION's implementation funnel:

Lead → Business Audit → Diagnosis → Qualified Opportunity → Scope → Proposal → Closed Won → Onboarding.

Qualification dimensions live in `lib/sales/motion.ts` and are the agent instructions, the pre-call questions, the during-call checklist, and the `qualification_profile` stored on call outcomes: current workflow/problem, business impact, existing systems/tools, automation opportunity, decision maker, implementation readiness, urgency/timeline, budget/commercial fit, and recommended AION service.

Business context (`existing_systems`, `workflow_problems`, `recommended_service`) describes the prospect workflow an AION engagement would change.

## System Context

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Sales Rep  │────▶│  Next.js App     │────▶│  Supabase       │
│  (browser)  │     │  (this repo)     │     │  canonical data │
└─────────────┘     └────────┬─────────┘     └─────────────────┘
                             │
              ┌──────────────┼──────────────────┐
              ▼              ▼                  ▼
      ┌──────────────┐ ┌───────────┐   ┌──────────────────┐
      │ AION Runtime │ │ CRM path  │   │ Learning events  │
      │ / AI Gateway │ │ (approve) │   │ (lib/learning)   │
      └──────┬───────┘ └─────┬─────┘   └────────┬─────────┘
             ▼               ▼                  ▼
      ┌──────────────┐ ┌───────────┐   ┌──────────────────┐
      │ OpenRouter / │ │ GHL       │   │ AION Learning /  │
      │ model providers│ │ Adapter │   │ Agent OS events  │
      └──────────────┘ └───────────┘   └──────────────────┘
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| App framework | Next.js 15 + TypeScript + shadcn/ui | AION standard stack; fast iteration |
| Data store | Supabase / Postgres (canonical revenue model) | Relational lead/call state; not a second CRM |
| AI | AION Runtime / AI Gateway → OpenRouter / providers | Centralized routing, billing, policy |
| Discrete decisions | Switchable adapters (`heuristic` \| `gateway` \| `semif`) | Models/tools stay agnostic; product calls `decide()` only |
| Self-learning memory | Switchable adapters (`local` \| `hindsight`) | Retain/recall/reflect from outcomes, tests, sessions, mistakes, practices |
| CRM writes | GHL Adapter, human-approved | Governed Contact → Opportunity → Note/Task only for pilot |
| Events | HTTP ingest to AION events infra | Decouple product from learning pipeline; Agent OS cost/ROI later |
| Deployment | Vercel | Standard for Next.js; CEO gate on prod |
| V1 scope | Assisted workspace, no autonomous calling | Validate workflow before automation |
| Sales motion | AION implementation funnel | Qualify workflow and implementation fit |
| Evidence | Production vs synthetic separation | Demo activity must not mutate real client records |
| UI expansion | **Frozen** at 7 Product Lab screens | Validate intelligence + real calls; see `docs/plans/mvp-intelligence-finish-line.md` |

## Decision adapters (model / tool agnostic)

Discrete sales choices (qualification, next-best action, objection strategy) go through `lib/decisions`, not vendor SDKs.

```
product code → decide(request) → adapter registry
                                    ├─ heuristic  (offline default)
                                    ├─ gateway    (AI Gateway JSON scores)
                                    └─ semif      (SemIf/OpenJev probabilities)
```

Contract: **state + question + options → scored options**. No free-text parse into CRM fields.

Switch with `AION_DECISION_ADAPTER`. SemIf credentials: `AION_SEMIF_URL`, `AION_SEMIF_API_KEY`. Gateway/SemIf failures fall back to heuristic so cockpit paths stay usable offline.

## Self-learning memory (Hindsight-shaped)

The copilot learns from **tests, runs, sessions, mistakes, and good practices** through a provider-agnostic memory loop adapted from [Hindsight](https://github.com/vectorize-io/hindsight):

```
product → retain / recall / reflect → adapter registry
                                        ├─ local     (in-process default)
                                        └─ hindsight (HTTP: /v1/default/banks/{id}/…)
```

Episode kinds: `call_outcome`, `decision`, `session`, `test_run`, `mistake`, `practice`.

Switch with `AION_LEARNING_MEMORY_ADAPTER`. Hindsight: `AION_HINDSIGHT_URL`, `AION_HINDSIGHT_API_KEY`. Default bank: `AION_LEARNING_BANK_ID` (per-org banks via `org-{id}`).

Post-call outcomes retain into the loop; during-call guidance recalls lessons; `/learning` reflects over retained episodes. Hindsight failures fall back to local so sales paths stay available.

## Components

| Component | Path | Responsibility |
|-----------|------|----------------|
| App shell | `app/` | Routes, layout, MVP screens |
| UI components | `components/` | Workflow phases, call panels |
| Sales domain | `lib/sales/` | Funnel, qualification dimensions, agent instructions, lead and outcome types |
| Qualification engine | `lib/sales/qualification-engine.ts` | 10-flag state machine + Copilot pitch policy |
| Cockpit helpers | `lib/cockpit/` | Prep, lineage, CRM proposals, follow-up drafts, **canonical post-call review** (`post-call-review.ts`) |
| Intelligence | `lib/intelligence/` | Pre-call brief, objection detection (AI) |
| AI client | `lib/ai/` | AION AI Gateway HTTP client |
| Decisions | `lib/decisions/` | Provider-agnostic discrete scoring (state+question+options → scores); SemIf/gateway/heuristic connectors |
| CRM | `lib/crm/` | Persist lead/call state, emit CRM events; approval-gated external writes |
| Learning | `lib/learning/` | Learning events + self-learning memory (`lib/learning/memory`) + **stable intervention identity** (`lib/learning/interventions.ts`) |

## Canonical data (target)
`revenue_leads`, `contacts`, `deals`, `activities`, `discovery_calls`, `proposals`, `outcomes`, `events`

Lineage target for recommendations:

**conversation → evidence → recommendation → rep decision → CRM action → outcome**

See [`DATA_MODEL.md`](./DATA_MODEL.md) for current table contracts; evolve toward the canonical set without inventing a parallel CRM.

## API / Server Actions (planned tasks)

| Surface | Purpose |
|---------|---------|
| `GET /api/leads/[id]/brief` | Pre-call intelligence |
| `POST /api/calls/[id]/guidance` | During-call suggestions |
| `POST /api/calls/[id]/outcome` | Post-call structured outcome |
| Internal | CRM persist + learning ingest |
| Internal (pilot) | Approval-gated GHL Adapter write proposals |

Builder tasks implement these as small PRs.

## Production guardrails
- Auth required before any lead/call data (Supabase Auth — task)
- API keys server-side only (`AION_*`, `SUPABASE_SERVICE_ROLE_KEY`, GHL credentials)
- Synthetic/demo paths must be labeled and blocked from production CRM mutation
- CRM write claims require external confirmation IDs; drafts stay drafts
- Security review mandatory before production deploy
- PII in transcripts — encrypt at rest, minimize retention (document in DATA_MODEL)

## Testing Strategy
| Layer | Location | Required for |
|-------|----------|--------------|
| Unit | `tests/unit/` | lib/intelligence, lib/learning, lib/crm |
| Critical path | `tests/critical-path/` | post-call → CRM + learning pipeline |
| Integration | `tests/integration/` | Supabase, AI Gateway (when wired) |
| Manual | `docs/VALIDATION.md` | Real prospect conversations (Gate A / Gate B) |

## Deployment
- **Preview:** Vercel preview on PR
- **Production:** CEO release gate; record in factory `RELEASE_RECORD.template.md`
- **Rollback:** Redeploy previous Vercel promotion

## Implementation Tasks

| # | Task | Role | Depends |
|---|------|------|---------|
| 1 | Supabase schema + RLS | Builder | — |
| 2 | Auth + rep session | Builder | 1 |
| 3 | Pre-call brief UI + API | Builder | 1, 2 |
| 4 | AI Gateway client (real) | Builder | — |
| 5 | During-call guidance panel | Builder | 3, 4 |
| 6 | Post-call outcome form | Builder | 3 |
| 7 | CRM persist (Supabase) | Builder | 1, 6 |
| 8 | Learning event ingest (live) | Builder | 6 |
| 9 | E2E critical path tests | Builder | 7, 8 |
| 10 | Production deploy + release record | Release | 9, QA, Security |
| 11 | Internal pilot evidence (Gate A) | QA / Operator | 10 |
| 12 | Commercial validation evidence (Gate B) | QA / Operator | 11 |

Tasks 11–12 are **validation**, not feature expansion.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI latency during live calls | High | Cache context; async suggestions |
| Learning contract drift | Medium | Version events in payload |
| Scope creep into CRM platform | High | Mission out-of-scope enforced; Product Lab freeze on features |
| Synthetic contamination of real CRM | High | Explicit demo/prod separation; approval + external confirm |
| Validation delayed by more build work | High | Gate A is the next product gate; UI freeze + P0 intelligence plan |
| Feature creep past frozen screens | High | Finish-line plan; no Mission 003 / autonomous calling |

## Approval
- [x] Architect scaffold complete
- [x] Product Lab: MVP → Validation (real-call evidence before commercialization)
- [ ] Human approved for production architecture changes (before prod deploy)
