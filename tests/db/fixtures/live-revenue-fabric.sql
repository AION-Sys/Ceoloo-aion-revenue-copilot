-- Test copy of the revenue fabric as it exists on the live AION project
-- before 20261003120000_revenue_tenant_isolation.sql: same table names, the
-- columns the RPCs touch, the same unconditional `true` policies, the same
-- grants, and verbatim copies of the RPCs / triggers the migration changes or
-- depends on. Read from the live catalog on 2026-10-03. Test-only.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  event_type text not null,
  department text not null,
  agent_name text,
  workflow_name text,
  severity text not null default 'info',
  status text not null default 'open',
  trigger_source text,
  environment text not null default 'production',
  title text not null,
  description text,
  recommended_action text,
  owner text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;

create table public.aion_tasks (
  id uuid primary key default gen_random_uuid(),
  task_id text not null,
  requested_by text not null default 'atlas',
  assigned_worker text,
  department text not null default 'revenue',
  task_type text not null,
  objective text not null,
  inputs jsonb default '{}'::jsonb,
  constraints jsonb default '{}'::jsonb,
  status text not null default 'pending',
  priority text not null default 'P2'
);
alter table public.aion_tasks enable row level security;

create table public.revenue_leads (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null unique,
  company text,
  status text not null default 'New',
  pipeline_stage text not null default 'TARGET',
  next_action text,
  qual_decision_maker boolean not null default false,
  qual_legitimate_pain boolean not null default false,
  qual_service_fit boolean not null default false,
  qual_economic_value boolean not null default false,
  qual_willingness boolean not null default false,
  created_by text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table public.revex_research (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null,
  findings text,
  pain_signals text,
  digital_gaps text,
  recommended_offer text,
  confidence numeric,
  created_by text,
  updated_by text,
  source text
);

create table public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  revenue_event_id text not null,
  lead_id text,
  revenue_status text not null default 'pending',
  verified_by text
);

create table public.revenue_sync_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  lead_id text,
  payload jsonb not null default '{}'::jsonb,
  actor_id text,
  delivery_status text not null default 'pending'
);

create or replace function public.guard_revenue_sync_event_immutability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'revenue_sync_events is append-only; events cannot be deleted' using errcode = '55000';
  end if;
  if row(new.event_id, new.lead_id, new.payload, new.actor_id)
     is distinct from row(old.event_id, old.lead_id, old.payload, old.actor_id) then
    raise exception 'revenue_sync_events event data is immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger revenue_sync_events_immutable_guard
before update or delete on public.revenue_sync_events
for each row execute function public.guard_revenue_sync_event_immutability();

-- Remaining fabric tables: shape does not matter to the migration.
do $$
declare
  t text;
begin
  foreach t in array array[
    'revenue_activities', 'revenue_contacts', 'revenue_deals', 'revenue_discovery_calls',
    'revenue_factory_sync_conflicts', 'revenue_factory_sync_state', 'revenue_outcomes',
    'revenue_proposals', 'revenue_vertical_kpis', 'revenue_vertical_strategies',
    'revenue_vertical_workflows', 'revex_agent_runs', 'revex_audits', 'revex_conversations',
    'revex_daily_metrics', 'revex_kpis', 'revex_outreach'
  ] loop
    execute format(
      'create table public.%I (id uuid primary key default gen_random_uuid(), lead_id text, created_by text, updated_by text)',
      t);
  end loop;
end;
$$;

-- RLS + live policies (all unconditional).
do $$
declare
  t text;
begin
  foreach t in array array[
    'revenue_activities', 'revenue_contacts', 'revenue_deals', 'revenue_discovery_calls',
    'revenue_events', 'revenue_factory_sync_conflicts', 'revenue_factory_sync_state',
    'revenue_leads', 'revenue_outcomes', 'revenue_proposals', 'revenue_sync_events',
    'revenue_vertical_kpis', 'revenue_vertical_strategies', 'revenue_vertical_workflows',
    'revex_agent_runs', 'revex_audits', 'revex_conversations', 'revex_daily_metrics',
    'revex_kpis', 'revex_outreach', 'revex_research'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  foreach t in array array[
    'revenue_activities', 'revenue_deals', 'revenue_discovery_calls', 'revenue_events',
    'revenue_outcomes', 'revenue_proposals'
  ] loop
    execute format('create policy authenticated_all on public.%I for all to authenticated using (true) with check (true)', t);
    execute format('create policy authenticated_read on public.%I for select to authenticated using (true)', t);
  end loop;

  foreach t in array array['revenue_contacts', 'revenue_leads'] loop
    execute format('create policy authenticated_read on public.%I for select to authenticated using (true)', t);
  end loop;

  foreach t in array array[
    'revex_agent_runs', 'revex_audits', 'revex_conversations', 'revex_daily_metrics',
    'revex_kpis', 'revex_outreach', 'revex_research'
  ] loop
    execute format('create policy revex_authenticated_all on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end;
$$;

create view public.revex_ceo_pipeline with (security_invoker = true) as
  select lead_id, company, pipeline_stage from public.revenue_leads;

-- RPCs and triggers, verbatim from the live project.

CREATE OR REPLACE FUNCTION public.revex_emit_event(p_event_type text, p_title text, p_description text DEFAULT NULL::text, p_agent_name text DEFAULT NULL::text, p_lead_id text DEFAULT NULL::text, p_severity text DEFAULT 'info'::text, p_recommended_action text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.events (
    correlation_id, event_type, department, agent_name, workflow_name,
    severity, status, trigger_source, environment, title, description,
    recommended_action, owner, metadata
  ) VALUES (
    COALESCE(p_lead_id, gen_random_uuid()::text), p_event_type, 'Revenue',
    p_agent_name, 'revex_30d', p_severity, 'open', 'revex', 'production',
    p_title, p_description, p_recommended_action, 'CEO Office',
    jsonb_build_object('lead_id', p_lead_id, 'fabric', 'revex')
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.revex_open_work(p_lead_id text, p_task_type text, p_objective text, p_actor_id text DEFAULT 'human_operator'::text, p_assigned_worker text DEFAULT NULL::text, p_priority text DEFAULT 'P2'::text, p_inputs jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company text;
  v_stage text;
  v_task_id text;
  v_id uuid;
  v_event uuid;
  v_n int;
BEGIN
  IF p_lead_id IS NULL OR btrim(p_lead_id) = '' THEN
    RAISE EXCEPTION 'lead_id required';
  END IF;
  IF p_task_type IS NULL OR btrim(p_task_type) = '' OR p_objective IS NULL OR btrim(p_objective) = '' THEN
    RAISE EXCEPTION 'task_type and objective required';
  END IF;
  IF lower(p_task_type) IN ('qualify','qualified','collect','revenue.collected','gmail.send','send')
     OR p_task_type ILIKE '%gmail.send%' THEN
    RAISE EXCEPTION 'work cannot qualify, collect, or send';
  END IF;

  SELECT company, pipeline_stage INTO v_company, v_stage
    FROM public.revenue_leads WHERE lead_id = p_lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown lead_id %', p_lead_id;
  END IF;

  SELECT COALESCE(max(substring(task_id from 10)::int), 0) + 1 INTO v_n
    FROM public.aion_tasks WHERE task_id ~ '^AION-REV-[0-9]+$';
  v_task_id := 'AION-REV-' || lpad(v_n::text, 5, '0');

  INSERT INTO public.aion_tasks (
    task_id, requested_by, assigned_worker, department, task_type, objective,
    inputs, constraints, status, priority
  ) VALUES (
    v_task_id,
    COALESCE(NULLIF(p_actor_id, ''), 'human_operator'),
    p_assigned_worker,
    'revenue',
    p_task_type,
    p_objective,
    COALESCE(p_inputs, '{}'::jsonb) || jsonb_build_object('lead_id', p_lead_id),
    jsonb_build_object(
      'deny_tools', jsonb_build_array('gmail.send'),
      'no_collect', true,
      'no_qualified', true
    ),
    'pending',
    COALESCE(p_priority, 'P2')
  ) RETURNING id INTO v_id;

  v_event := public.revex_emit_event(
    'work.opened',
    'Work item opened',
    v_task_id,
    COALESCE(NULLIF(p_actor_id, ''), 'human_operator'),
    p_lead_id,
    'info',
    NULL
  );

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_id,
    'task_id', v_task_id,
    'lead_id', p_lead_id,
    'pipeline_stage', v_stage,
    'status', 'pending',
    'event_id', v_event
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.revex_clear_legacy_status(p_lead_id text, p_actor_id text DEFAULT 'human_operator'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_before text;
  v_stage text;
  v_dm boolean;
  v_pain boolean;
  v_fit boolean;
  v_econ boolean;
  v_will boolean;
BEGIN
  SELECT status, pipeline_stage,
         qual_decision_maker, qual_legitimate_pain, qual_service_fit,
         qual_economic_value, qual_willingness
    INTO v_before, v_stage, v_dm, v_pain, v_fit, v_econ, v_will
    FROM public.revenue_leads
   WHERE lead_id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown lead_id %', p_lead_id;
  END IF;

  UPDATE public.revenue_leads
     SET status = 'New',
         updated_by = COALESCE(NULLIF(p_actor_id, ''), updated_by),
         updated_at = now()
   WHERE lead_id = p_lead_id;

  RETURN jsonb_build_object(
    'ok', true,
    'lead_id', p_lead_id,
    'status_before', v_before,
    'status_after', 'New',
    'pipeline_stage', v_stage,
    'qual_decision_maker', v_dm,
    'qual_legitimate_pain', v_pain,
    'qual_service_fit', v_fit,
    'qual_economic_value', v_econ,
    'qual_willingness', v_will
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.revex_pipeline_changed()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    PERFORM public.revex_emit_event(
      'pipeline.stage_changed',
      format('%s -> %s', OLD.pipeline_stage, NEW.pipeline_stage),
      NEW.company, NEW.updated_by, NEW.lead_id, 'info', NEW.next_action
    );
  END IF;
  RETURN NEW;
END;
$function$;

create trigger trg_revex_pipeline_changed
after update on public.revenue_leads
for each row execute function public.revex_pipeline_changed();

CREATE OR REPLACE FUNCTION public.revex_record_research(p_lead_id text, p_findings text, p_pain_signals text DEFAULT NULL::text, p_digital_gaps text DEFAULT NULL::text, p_recommended_offer text DEFAULT NULL::text, p_confidence numeric DEFAULT NULL::numeric, p_actor_id text DEFAULT 'revenue_intelligence_01'::text, p_advance_stage boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_stage text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.revenue_leads WHERE lead_id = p_lead_id) THEN
    RAISE EXCEPTION 'unknown lead_id %', p_lead_id;
  END IF;

  INSERT INTO public.revex_research (
    lead_id, findings, pain_signals, digital_gaps, recommended_offer, confidence,
    created_by, updated_by, source
  ) VALUES (
    p_lead_id, p_findings, p_pain_signals, p_digital_gaps, p_recommended_offer,
    p_confidence, p_actor_id, p_actor_id, 'revex_research'
  ) RETURNING id INTO v_id;

  IF p_advance_stage THEN
    UPDATE public.revenue_leads
       SET pipeline_stage = CASE WHEN pipeline_stage = 'TARGET' THEN 'RESEARCHED' ELSE pipeline_stage END,
           next_action = COALESCE(next_action, 'Queue for outreach'),
           updated_by = p_actor_id,
           updated_at = now()
     WHERE lead_id = p_lead_id
       AND pipeline_stage IN ('TARGET','RESEARCHED');
  END IF;

  SELECT pipeline_stage INTO v_stage FROM public.revenue_leads WHERE lead_id = p_lead_id;

  PERFORM public.revex_emit_event(
    'research.completed', 'Research recorded', p_lead_id, p_actor_id, p_lead_id, 'info',
    'Recalculate opportunity score'
  );

  RETURN jsonb_build_object('ok', true, 'research_id', v_id, 'lead_id', p_lead_id, 'pipeline_stage', v_stage);
END;
$function$;

-- Live grants on the two lead RPCs: no anon, signed-in users allowed.
revoke all on function public.revex_open_work(text,text,text,text,text,text,jsonb) from public, anon;
revoke all on function public.revex_clear_legacy_status(text,text) from public, anon;
