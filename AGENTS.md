# Agent Operating Contract

This product repository is governed by the [AION Software Factory](https://github.com/AION-Sys/aion-software-factory).

## Before Acting
1. Read `AION_ENGINEERING.md` in the factory repo.
2. Read [MISSION-002](https://github.com/AION-Sys/aion-software-factory/blob/main/missions/MISSION-002.md).
3. Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, and relevant task scope.
4. Do not expand into out-of-scope items (autonomous calling, CRM replacement, workflow builder).

## During Execution
- Small PRs only — one architecture task where possible.
- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` before handoff.
- Never commit secrets.

## Active Mission
**MISSION-002 — AION Revenue Conversion Copilot** (P0)

Mission 003 is blocked until Mission 002 validation gates pass.

## Superpowers (session discipline)

Agents layer [obra/superpowers](https://github.com/obra/superpowers) for **how** to design, plan, implement, and verify inside a coding session. AION (factory mission + this contract) remains authoritative for **what** may be built and which gates apply.

| Concern | Source of truth |
|---------|-----------------|
| Mission scope, CEO gates, secrets, out-of-scope | This contract + factory `AION_ENGINEERING.md` + [MISSION-002](https://github.com/AION-Sys/aion-software-factory/blob/main/missions/MISSION-002.md) |
| Brainstorm → plan → TDD → verify → finish branch | Superpowers skills (Cursor: `/add-plugin superpowers`) |
| Role ↔ skill map and conflict rules | Factory [`docs/workflows/SUPERPOWERS.md`](https://github.com/AION-Sys/aion-software-factory/blob/main/docs/workflows/SUPERPOWERS.md) |
| Always-on bridge (this repo) | [`.cursor/rules/superpowers-aion-bridge.mdc`](.cursor/rules/superpowers-aion-bridge.mdc), [`.cursor/skills/aion-superpowers-bridge/SKILL.md`](.cursor/skills/aion-superpowers-bridge/SKILL.md) |

**Priority when instructions conflict:** human/CEO → factory constitution/mission + this file → product docs (`PRD` / `ARCHITECTURE` / tasks) → Superpowers skills → defaults. Superpowers must not bypass approval gates, invent Mission 003 product work, or expand Mission 002 out-of-scope items.

Do **not** vendor Superpowers skill bodies into this repo; install the marketplace plugin for full skill text.

## Cursor Cloud specific instructions

- Node 22 and npm are on the default image. CI and local setup both use `npm ci` (lockfile), then `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Dev server: `npm run dev -- --hostname 0.0.0.0 --port 3000`.
- Demo rep sign-in works with no `.env.local`. Open `/login` and use `rep@demo.local` / `demo-rep-password`, then open the Acme HVAC lead and start a call. Do not block on Supabase or AION gateway secrets for this path. Those env vars are only needed for persisted data (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and live AI objection reframes (`AION_AI_GATEWAY_URL`, `AION_AI_GATEWAY_API_KEY`).
