---
name: aion-superpowers-bridge
description: Use at session start and whenever choosing between Superpowers skills and AION product-repo rules — maps obra/superpowers workflows onto Mission 002 scope and approval gates without bypassing governance.
---

# AION × Superpowers bridge (product repo)

## When to use

- Starting any coding session in this Revenue Copilot product repo
- Choosing which Superpowers skill fits the current Builder/QA phase
- Resolving conflict between "build it now" impulses and AION gates

## Instructions

1. **Load AION context first:** factory `AION_ENGINEERING.md` → [MISSION-002](https://github.com/AION-Sys/aion-software-factory/blob/main/missions/MISSION-002.md) → this repo `docs/PRD.md`, `docs/ARCHITECTURE.md`, and the assigned task. State assumptions; do not invent consequential product requirements or Mission 003 work.

2. **If Superpowers is installed**, follow `using-superpowers` for skill invocation. If it is **not** installed, still follow the discipline below using this bridge and the factory [`SUPERPOWERS.md`](https://github.com/AION-Sys/aion-software-factory/blob/main/docs/workflows/SUPERPOWERS.md).

3. **Pick the skill by phase:**

| Situation | Superpowers skill | Product-repo output |
|-----------|-------------------|---------------------|
| Unclear intent within an approved task | `brainstorming` | Short design note in PR / architecture clarification |
| Multi-step approved design | `writing-plans` | Plan mapped to existing Architect tasks; optional `docs/plans/` |
| Implementing a bounded task | `executing-plans` or `subagent-driven-development` | Small PR in **this** repo |
| Logic change | `test-driven-development` | Tests + `npm test` / lint / typecheck / build |
| About to claim done | `verification-before-completion` | Fresh command evidence in PR |
| Bug / failing CI | `systematic-debugging` | Fix + regression test |
| Branch complete | `finishing-a-development-branch` | PR using this repo’s PR template |

4. **Plan file location:** Prefer existing architecture tasks and product `docs/`. If writing a Superpowers-style plan file, put it under `docs/plans/` — not as a substitute for Architect task scope.

5. **Handoff:** State what was requested/completed, files changed, checks run, limitations, risks, next action, and whether human approval is required.

6. **Factory vs product:** Application code changes belong here. Factory process docs live in [aion-software-factory](https://github.com/AION-Sys/aion-software-factory). Do not vendor Superpowers skill bodies.

## Anti-patterns

- Skipping CEO gates because a Superpowers plan says "merge"
- Brainstorming Mission 003 product work while Mission 002 validation is open
- Expanding into autonomous calling, CRM replacement, or workflow builder
- Claiming tests pass without running them this session
- Vendoring or rewriting upstream Superpowers skill files in this repo
