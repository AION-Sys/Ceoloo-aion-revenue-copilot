-- Migrate Revenue Copilot off the funding sales schema.
-- Funnel: Lead → Business Audit → Problem/Workflow Diagnosis → Qualified Opportunity
--         → Solution/Implementation Scope → Proposal → Closed Won → Onboarding
-- Qualification is workflow, impact, systems, automation, decision maker,
-- implementation readiness, timeline, commercial fit, and recommended AION service.

-- ---------------------------------------------------------------------------
-- business_contexts: prospect workflow, not a funding product
-- ---------------------------------------------------------------------------

alter table public.business_contexts
  rename column services to existing_systems;

alter table public.business_contexts
  rename column likely_pains to workflow_problems;

alter table public.business_contexts
  rename column relevant_offer to recommended_service;

comment on column public.business_contexts.existing_systems is
  'Systems and tools already in the prospect workflow.';

comment on column public.business_contexts.workflow_problems is
  'Current workflow problems to diagnose. Not capital requirements.';

comment on column public.business_contexts.recommended_service is
  'Recommended AION service for this account.';

-- ---------------------------------------------------------------------------
-- leads: coarse new/contacted/qualified/closed → implementation funnel
-- ---------------------------------------------------------------------------

update public.leads
set status = case status
  when 'new' then 'lead'
  when 'contacted' then 'business_audit'
  when 'qualified' then 'qualified_opportunity'
  when 'closed' then 'closed_won'
  else status
end
where status in ('new', 'contacted', 'qualified', 'closed');

alter table public.leads
  alter column status set default 'lead';

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check
  check (
    status in (
      'lead',
      'business_audit',
      'problem_diagnosis',
      'qualified_opportunity',
      'solution_scope',
      'proposal',
      'closed_won',
      'onboarding'
    )
  );

-- ---------------------------------------------------------------------------
-- call_outcomes: structured AION qualification profile
-- ---------------------------------------------------------------------------

alter table public.call_outcomes
  add column if not exists qualification_profile jsonb not null default '{}'::jsonb;

comment on column public.call_outcomes.qualification_profile is
  'AION qualification dimensions: currentWorkflow, businessImpact, existingSystems, automationOpportunity, decisionMaker, implementationReadiness, urgencyTimeline, budgetFit, recommendedService.';
