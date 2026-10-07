# Plan — MVP Command Center Cockpit UI

## Goal
Reshape the product UI into the Product Lab **tight 7-screen** sales command center — not a light CRM shell.

## Screens

| # | Screen | Route | Nav |
|---|--------|-------|-----|
| 1 | Today / Command Center | `/dashboard` | Primary |
| 2 | Prospect Workspace | `/prospects`, `/prospects/[id]` | Primary |
| 3 | Call Prep | `/prospects/[id]/prep` | Workflow |
| 4 | Live Call | `/calls/[callId]/live` | Workflow |
| 5 | Post-Call Review | `/calls/[callId]/review` | Workflow |
| 6 | Follow-Up | `/follow-up` | Primary |
| 7 | Learning | `/learning` | Primary |

Settings stays in the account menu only. Legacy CRM routes (`/contacts`, `/pipeline`, `/tasks`, `/accounts`, `/activity`, `/intelligence`, `/integrations`) redirect into the cockpit.

## Gaps addressed
- Prospect: interaction history + qualification completeness
- Live: rep-captured transcript/notes, buying signals, commitments (no fake “sent/transcribed” claims)
- Post-call / Follow-up: draft vs approved CRM/message actions
- Learning: intervention → outcome → stage movement surface
- Lineage trail UI: recommendation → decision → CRM action → outcome

## Funnel mapping (already on main)
- unqualified / exploring → `business_audit`
- qualified → `qualified_opportunity`
- disqualified → `closed_won`

## Out of scope
Autonomous calling, CRM replacement, workflow builder, Mission 003.
