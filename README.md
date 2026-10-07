# AION Revenue Conversion Copilot

AI-assisted sales workspace for home-service contractors and SMB sales teams — the first **Factory → Product → Revenue → Learning** validation build (Mission 002).

**Product Lab:** MVP → Validation. Next gate is real-call evidence — not more features. See [`docs/PRODUCT_LAB.md`](docs/PRODUCT_LAB.md).

## Mission
[aion-software-factory: MISSION-002](https://github.com/AION-Sys/aion-software-factory/blob/main/missions/MISSION-002.md)

## Workflow (MVP)
**Prepare → Call → Capture → Analyze → Follow Up → Learn**

1. **Before conversation** — lead intelligence, workflow problems, systems, recommended AION service, qualification questions
2. **During conversation** — guidance, checklist, objections, qualification, next-best action (rep in control)
3. **After conversation** — structured outcome, reviewable CRM changes, learning event

## Repository Structure

```
aion-revenue-copilot/
├── app/                 # Next.js routes
├── components/          # UI
├── lib/
│   ├── ai/              # AION AI Gateway client
│   ├── intelligence/    # Pre-call / during-call logic
│   ├── sales/           # Domain types
│   ├── learning/        # Learning event pipeline
│   └── crm/             # Persistence + CRM events
├── tests/
│   ├── unit/
│   ├── integration/
│   └── critical-path/
├── docs/
│   ├── PRODUCT_LAB.md   # Product Lab classification + MVP promise
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── VALIDATION.md    # Gate A (5-call) + Gate B (~25-call)
│   └── validation/      # Gate A runbook + evidence templates
└── .github/workflows/ci.yml
```

## Stack
Next.js 15 · TypeScript · shadcn/ui · Supabase · AION Runtime / AI Gateway · OpenRouter · GHL Adapter (governed CRM) · AION event/learning infrastructure · Vercel

## Local Development

```bash
cp .env.example .env.local
# Fill Supabase and AION gateway values (never commit secrets)
npm install
npm run dev
```

### Preview / Vercel testing without Supabase

**Demo rep auth is on by default** for MVP testing:

| Field | Value |
|-------|--------|
| Email | `rep@demo.local` |
| Password | `demo-rep-password` |

Sign in at `/login`, then open the Acme HVAC lead for pre-call → call guidance. Set `ENABLE_DEMO_AUTH=false` once real Supabase Auth should be the only path. Optional: `npm run seed:preview` seeds the same credentials into Supabase.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Agent Contract
Agents follow [aion-software-factory AGENTS.md](https://github.com/Ceoloo/aion-software-factory/blob/main/AGENTS.md). Work in small PRs against tasks in `docs/ARCHITECTURE.md`.

## Validation
Real-world evidence goes in [`docs/VALIDATION.md`](docs/VALIDATION.md).

**Gate A operators:** start at [`docs/validation/GATE_A_RUNBOOK.md`](docs/validation/GATE_A_RUNBOOK.md) (session templates under `docs/validation/templates/`).

| Gate | Bar |
|------|-----|
| A — Internal pilot | 5 eligible real call sessions |
| B — Commercial validation | ~25 conversations + accuracy / usefulness / stage / conversion / lineage |

Mission 002 does not close until Revenue + Validation gates pass. Mission 003 stays blocked until then.
