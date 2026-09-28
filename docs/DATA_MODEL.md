# Data Model — AION Revenue Conversion Copilot

## Status
DRAFT — implement in Supabase migration (Task 1)

## Overview
Relational model in Postgres (Supabase) for leads, business context, calls, outcomes, and event audit trail.

## Entities

### `business_contexts`
Prospect workflow context for AION's implementation motion. Not a funding application.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | Tenant boundary |
| industry | text | Prospect industry |
| existing_systems | jsonb | string[] — tools already in the workflow |
| workflow_problems | jsonb | string[] — current workflow problems |
| recommended_service | text | nullable — recommended AION service |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `leads`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | |
| business_context_id | uuid FK | nullable |
| company_name | text | |
| contact_name | text | nullable |
| source | text | outbound, inbound, etc. |
| status | text | lead, business_audit, problem_diagnosis, qualified_opportunity, solution_scope, proposal, closed_won, onboarding |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `calls`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| lead_id | uuid FK | |
| rep_user_id | uuid FK | auth.users |
| phase | text | pre, active, post, completed |
| started_at | timestamptz | |
| ended_at | timestamptz | nullable |

### `call_outcomes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| call_id | uuid FK | unique |
| qualification | text | unqualified, exploring, qualified, disqualified |
| qualification_profile | jsonb | AION dimensions: currentWorkflow, businessImpact, existingSystems, automationOpportunity, decisionMaker, implementationReadiness, urgencyTimeline, budgetFit, recommendedService |
| pain_points | jsonb | string[] — workflow problems heard on the call |
| objections | jsonb | ObjectionRecord[] |
| next_action | text | |
| transcript_summary | text | nullable |
| created_at | timestamptz | |

### `event_log`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| call_id | uuid FK | nullable |
| lead_id | uuid FK | nullable |
| event_type | text | crm, learning |
| payload | jsonb | |
| external_id | text | nullable — ingest ack |
| created_at | timestamptz | |

## TypeScript Mapping
Domain types live in `lib/sales/types.ts`. Keep DB columns aligned with those types.

## RLS (required)
- Reps access only rows for their `organization_id`
- Service role for server-side ingest only — never exposed to client

## Learning Event Payload (contract v1)

```json
{
  "schema_version": "1",
  "event_type": "call_outcome",
  "organization_id": "uuid",
  "lead_id": "uuid",
  "call_id": "uuid",
  "qualification": "exploring",
  "qualification_profile": {
    "currentWorkflow": "Jobs are tracked in a spreadsheet",
    "recommendedService": "workflow automation implementation"
  },
  "objection_count": 2,
  "pain_point_count": 3,
  "next_action": "send proposal",
  "occurred_at": "ISO-8601"
}
```

## CRM Event Payload (contract v1)

```json
{
  "schema_version": "1",
  "event_type": "call_completed",
  "lead_id": "uuid",
  "qualification": "exploring",
  "next_action": "send proposal",
  "outcome_id": "uuid",
  "occurred_at": "ISO-8601"
}
```

## Migration Order
1. organizations (if not shared auth tenant table)
2. business_contexts
3. leads
4. calls
5. call_outcomes
6. event_log
7. `20260927120000_aion_sales_motion.sql` — funnel statuses, workflow context columns, qualification profile
