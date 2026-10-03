-- Revenue tenant isolation (P0, 2026-10 Supabase authorization audit)
--
-- Closes the access gaps on the revenue fabric (revenue_* / revex_* tables and
-- the revex_* RPCs that write them) in the live AION project:
--
--   1. Every revenue row belongs to an organization. Access is organization
--      membership (public.organization_members), the tenancy model the Copilot
--      tables already use, replacing the `using (true)` / `with check (true)`
--      policies that let any signed-in user read and rewrite every record.
--   2. `anon` loses all table privileges on the revenue fabric (it had full
--      DML grants; RLS was the only barrier) and `authenticated` loses
--      TRUNCATE / TRIGGER / REFERENCES, which RLS does not govern.
--   3. revex_emit_event is no longer callable without signing in.
--      revex_open_work and revex_clear_legacy_status check that the lead
--      belongs to the caller's organization before touching it.
--   4. Audit identity is derived from the authenticated principal: for a
--      signed-in caller, created_by / updated_by / verified_by / actor_id and
--      event agent_name are stamped as `user:<auth.uid()>`, whatever the
--      request claimed. service_role and direct database jobs (agents) carry
--      no JWT subject and keep their declared agent identity.
--
-- The revenue fabric was created directly on the live project, outside any
-- repository, so every step is guarded: tables or functions that do not exist
-- (for example a fresh local Copilot database) are skipped.
--
-- Existing rows are assigned to the organization only when exactly one
-- organization exists; otherwise the migration stops and asks for an explicit
-- assignment. New rows default to the caller's sole organization (or, for
-- service_role / database jobs, the sole organization); once a second
-- organization exists, writers must pass organization_id explicitly or the
-- NOT NULL constraint rejects the insert (fail closed).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Audit identity of the signed-in principal; NULL for service_role and
-- direct database sessions (no JWT subject).
create or replace function public.revex_actor()
returns text
language sql
stable
set search_path = ''
as $$
  select case when auth.uid() is null then null else 'user:' || auth.uid()::text end;
$$;

create or replace function public.revex_default_organization_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_orgs uuid[];
begin
  if auth.uid() is not null then
    select array_agg(m.organization_id) into v_orgs
      from public.organization_members m
     where m.user_id = auth.uid();
  else
    select array_agg(o.id) into v_orgs from public.organizations o;
  end if;

  if coalesce(array_length(v_orgs, 1), 0) = 1 then
    return v_orgs[1];
  end if;
  return null;
end;
$$;

-- Stamps audit columns from the authenticated principal. Trigger arguments
-- name the columns: 'c:<col>' is set on INSERT and pinned on UPDATE,
-- 'm:<col>' is set on every write, 'v:<col>' is set whenever the write gives
-- it a (new) non-null value.
create or replace function public.revex_stamp_actor()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_actor text := public.revex_actor();
  v_new jsonb;
  v_old jsonb;
  v_patch jsonb := '{}'::jsonb;
  v_arg text;
  v_kind text;
  v_col text;
begin
  if v_actor is null then
    return new;
  end if;

  v_new := to_jsonb(new);
  v_old := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;

  foreach v_arg in array tg_argv loop
    v_kind := split_part(v_arg, ':', 1);
    v_col := split_part(v_arg, ':', 2);
    if v_kind = 'c' then
      v_patch := v_patch || jsonb_build_object(
        v_col, case when tg_op = 'INSERT' then to_jsonb(v_actor) else v_old -> v_col end);
    elsif v_kind = 'm' then
      v_patch := v_patch || jsonb_build_object(v_col, v_actor);
    elsif v_kind = 'v' then
      if v_new ->> v_col is not null
         and (tg_op = 'INSERT' or (v_new -> v_col) is distinct from (v_old -> v_col)) then
        v_patch := v_patch || jsonb_build_object(v_col, v_actor);
      end if;
    end if;
  end loop;

  new := jsonb_populate_record(new, v_patch);
  return new;
end;
$$;

-- Column defaults and triggers run as the writing role, so both helpers stay
-- executable by every role that may write (authenticated, service_role,
-- postgres); anon has no write grants on these tables after this migration.
revoke all on function public.revex_actor() from public, anon;
revoke all on function public.revex_default_organization_id() from public, anon;
revoke all on function public.revex_stamp_actor() from public, anon;
grant execute on function public.revex_actor() to authenticated, service_role;
grant execute on function public.revex_default_organization_id() to authenticated, service_role;

-- Membership lookup used by every organization policy: signed-in users only.
revoke all on function public.user_organization_ids() from public, anon;
grant execute on function public.user_organization_ids() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tables: organization ownership, membership policies, grants
-- ---------------------------------------------------------------------------

do $$
declare
  v_tables text[] := array[
    'revenue_activities', 'revenue_contacts', 'revenue_deals',
    'revenue_discovery_calls', 'revenue_events', 'revenue_factory_sync_conflicts',
    'revenue_factory_sync_state', 'revenue_leads', 'revenue_outcomes',
    'revenue_proposals', 'revenue_sync_events', 'revenue_vertical_kpis',
    'revenue_vertical_strategies', 'revenue_vertical_workflows',
    'revex_agent_runs', 'revex_audits', 'revex_conversations',
    'revex_daily_metrics', 'revex_kpis', 'revex_outreach', 'revex_research'
  ];
  v_views text[] := array['revex_ceo_pipeline', 'revex_ceo_waiting_on_human'];
  v_orgs uuid[];
  v_table text;
  v_has_rows boolean;
  v_pol record;
  v_cmds text[];
  v_scope constant text := 'organization_id in (select public.user_organization_ids())';
begin
  select array_agg(id) into v_orgs from public.organizations;

  foreach v_table in array v_tables loop
    if to_regclass(format('public.%I', v_table)) is null then
      raise notice 'revenue tenant isolation: % not present, skipped', v_table;
      continue;
    end if;

    -- 1. Organization ownership.
    if not exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = v_table and column_name = 'organization_id'
    ) then
      execute format('select exists (select 1 from public.%I)', v_table) into v_has_rows;

      if coalesce(array_length(v_orgs, 1), 0) = 1 then
        -- Constant default: existing rows are labelled without rewriting them,
        -- so no UPDATE trigger (pipeline events, immutability guards) fires.
        execute format(
          'alter table public.%I add column organization_id uuid not null default %L',
          v_table, v_orgs[1]);
      elsif v_has_rows then
        raise exception
          'revenue tenant isolation: % has rows but % organizations exist; assign organization_id explicitly',
          v_table, coalesce(array_length(v_orgs, 1), 0);
      else
        execute format('alter table public.%I add column organization_id uuid not null', v_table);
      end if;
    end if;

    execute format(
      'alter table public.%I alter column organization_id set default public.revex_default_organization_id()',
      v_table);

    if not exists (
      select 1 from pg_constraint
       where conrelid = format('public.%I', v_table)::regclass
         and conname = v_table || '_organization_id_fkey'
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (organization_id) references public.organizations (id) on delete restrict',
        v_table, v_table || '_organization_id_fkey');
    end if;

    execute format('create index if not exists %I on public.%I (organization_id)',
      v_table || '_organization_id_idx', v_table);

    -- 2. Replace unconditional policies with organization-scoped ones, for the
    --    same commands only. Tables that had no policy stay closed to
    --    signed-in users (service_role keeps bypassing RLS).
    v_cmds := array[]::text[];
    for v_pol in
      select policyname, cmd
        from pg_policies
       where schemaname = 'public' and tablename = v_table
         and coalesce(qual, 'true') = 'true'
         and coalesce(with_check, 'true') = 'true'
    loop
      execute format('drop policy %I on public.%I', v_pol.policyname, v_table);
      v_cmds := v_cmds || case
        when v_pol.cmd = 'ALL' then array['SELECT', 'INSERT', 'UPDATE', 'DELETE']
        else array[v_pol.cmd]
      end;
    end loop;

    execute format('alter table public.%I enable row level security', v_table);

    if cardinality(v_cmds) > 0 then
      execute format('drop policy if exists org_members_select on public.%I', v_table);
      execute format('drop policy if exists org_members_insert on public.%I', v_table);
      execute format('drop policy if exists org_members_update on public.%I', v_table);
      execute format('drop policy if exists org_members_delete on public.%I', v_table);
    end if;

    if 'SELECT' = any (v_cmds) then
      execute format(
        'create policy org_members_select on public.%I for select to authenticated using (%s)',
        v_table, v_scope);
    end if;
    if 'INSERT' = any (v_cmds) then
      execute format(
        'create policy org_members_insert on public.%I for insert to authenticated with check (%s)',
        v_table, v_scope);
    end if;
    if 'UPDATE' = any (v_cmds) then
      execute format(
        'create policy org_members_update on public.%I for update to authenticated using (%s) with check (%s)',
        v_table, v_scope, v_scope);
    end if;
    if 'DELETE' = any (v_cmds) then
      execute format(
        'create policy org_members_delete on public.%I for delete to authenticated using (%s)',
        v_table, v_scope);
    end if;

    -- 3. Grants: nothing for anon; no RLS-exempt privileges for signed-in users.
    execute format('revoke all on public.%I from anon', v_table);
    execute format('revoke truncate, trigger, references on public.%I from authenticated', v_table);
  end loop;

  -- Revenue views are security_invoker (they inherit the policies above).
  foreach v_table in array v_views loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('revoke all on public.%I from anon', v_table);
      execute format('revoke insert, update, delete, truncate, trigger, references on public.%I from authenticated', v_table);
    end if;
  end loop;

  -- Tables the revex RPCs write besides the revenue fabric.
  foreach v_table in array array['events', 'aion_tasks', 'organizations', 'organization_members'] loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('revoke all on public.%I from anon', v_table);
      execute format('revoke truncate, trigger, references on public.%I from authenticated', v_table);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Audit identity triggers (named to sort before the existing trg_revex_*
-- triggers, so pipeline events see the stamped actor)
-- ---------------------------------------------------------------------------

do $$
declare
  v_spec record;
begin
  for v_spec in
    select * from (values
      ('revenue_leads', array['c:created_by', 'm:updated_by']),
      ('revex_audits', array['c:created_by', 'm:updated_by']),
      ('revex_research', array['c:created_by', 'm:updated_by']),
      ('revex_conversations', array['c:created_by']),
      ('revex_outreach', array['c:created_by']),
      ('revenue_events', array['v:verified_by']),
      ('revenue_sync_events', array['c:actor_id'])
    ) as s(table_name, args)
  loop
    if to_regclass(format('public.%I', v_spec.table_name)) is null then
      continue;
    end if;
    execute format('drop trigger if exists trg_revex_00_stamp_actor on public.%I', v_spec.table_name);
    execute format(
      'create trigger trg_revex_00_stamp_actor before insert or update on public.%I '
      || 'for each row execute function public.revex_stamp_actor(%s)',
      v_spec.table_name,
      (select string_agg(quote_literal(a), ', ') from unnest(v_spec.args) as a));
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileged (SECURITY DEFINER) RPCs
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regprocedure('public.revex_emit_event(text,text,text,text,text,text,text)') is not null then
    execute $fn$
      create or replace function public.revex_emit_event(
        p_event_type text,
        p_title text,
        p_description text default null,
        p_agent_name text default null,
        p_lead_id text default null,
        p_severity text default 'info',
        p_recommended_action text default null
      )
      returns uuid
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        v_id uuid;
        v_actor text := public.revex_actor();
        v_agent text := p_agent_name;
        v_metadata jsonb := jsonb_build_object('lead_id', p_lead_id, 'fabric', 'revex');
      begin
        if v_actor is not null then
          -- Signed-in callers emit as themselves, and only about their own leads.
          if p_lead_id is not null and not exists (
            select 1 from public.revenue_leads l
             where l.lead_id = p_lead_id
               and l.organization_id in (select public.user_organization_ids())
          ) then
            raise exception 'unknown lead_id %', p_lead_id using errcode = '42501';
          end if;
          v_agent := v_actor;
          v_metadata := v_metadata || jsonb_build_object('claimed_agent', p_agent_name);
        end if;

        insert into public.events (
          correlation_id, event_type, department, agent_name, workflow_name,
          severity, status, trigger_source, environment, title, description,
          recommended_action, owner, metadata
        ) values (
          coalesce(p_lead_id, gen_random_uuid()::text), p_event_type, 'Revenue',
          v_agent, 'revex_30d', p_severity, 'open', 'revex', 'production',
          p_title, p_description, p_recommended_action, 'CEO Office', v_metadata
        ) returning id into v_id;
        return v_id;
      end;
      $body$
    $fn$;
    revoke all on function public.revex_emit_event(text,text,text,text,text,text,text) from public, anon;
    -- authenticated keeps EXECUTE: invoker-rights revex_* RPCs and the
    -- revenue_leads pipeline trigger call it on the signed-in user's behalf.
    grant execute on function public.revex_emit_event(text,text,text,text,text,text,text) to authenticated, service_role;
  end if;

  if to_regprocedure('public.revex_open_work(text,text,text,text,text,text,jsonb)') is not null then
    execute $fn$
      create or replace function public.revex_open_work(
        p_lead_id text,
        p_task_type text,
        p_objective text,
        p_actor_id text default 'human_operator',
        p_assigned_worker text default null,
        p_priority text default 'P2',
        p_inputs jsonb default '{}'::jsonb
      )
      returns jsonb
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        v_actor text := coalesce(public.revex_actor(), nullif(p_actor_id, ''), 'human_operator');
        v_company text;
        v_stage text;
        v_task_id text;
        v_id uuid;
        v_event uuid;
        v_n int;
      begin
        if p_lead_id is null or btrim(p_lead_id) = '' then
          raise exception 'lead_id required';
        end if;
        if p_task_type is null or btrim(p_task_type) = '' or p_objective is null or btrim(p_objective) = '' then
          raise exception 'task_type and objective required';
        end if;
        if lower(p_task_type) in ('qualify','qualified','collect','revenue.collected','gmail.send','send')
           or p_task_type ilike '%gmail.send%' then
          raise exception 'work cannot qualify, collect, or send';
        end if;

        -- Signed-in callers may only open work on their organization's leads.
        select company, pipeline_stage into v_company, v_stage
          from public.revenue_leads
         where lead_id = p_lead_id
           and (auth.uid() is null
                or organization_id in (select public.user_organization_ids()));
        if not found then
          raise exception 'unknown lead_id %', p_lead_id using errcode = '42501';
        end if;

        select coalesce(max(substring(task_id from 10)::int), 0) + 1 into v_n
          from public.aion_tasks where task_id ~ '^AION-REV-[0-9]+$';
        v_task_id := 'AION-REV-' || lpad(v_n::text, 5, '0');

        insert into public.aion_tasks (
          task_id, requested_by, assigned_worker, department, task_type, objective,
          inputs, constraints, status, priority
        ) values (
          v_task_id,
          v_actor,
          p_assigned_worker,
          'revenue',
          p_task_type,
          p_objective,
          coalesce(p_inputs, '{}'::jsonb) || jsonb_build_object('lead_id', p_lead_id),
          jsonb_build_object(
            'deny_tools', jsonb_build_array('gmail.send'),
            'no_collect', true,
            'no_qualified', true
          ),
          'pending',
          coalesce(p_priority, 'P2')
        ) returning id into v_id;

        v_event := public.revex_emit_event(
          'work.opened', 'Work item opened', v_task_id, v_actor, p_lead_id, 'info', null);

        return jsonb_build_object(
          'ok', true,
          'id', v_id,
          'task_id', v_task_id,
          'lead_id', p_lead_id,
          'pipeline_stage', v_stage,
          'status', 'pending',
          'event_id', v_event
        );
      end;
      $body$
    $fn$;
    revoke all on function public.revex_open_work(text,text,text,text,text,text,jsonb) from public, anon;
    grant execute on function public.revex_open_work(text,text,text,text,text,text,jsonb) to authenticated, service_role;
  end if;

  if to_regprocedure('public.revex_clear_legacy_status(text,text)') is not null then
    execute $fn$
      create or replace function public.revex_clear_legacy_status(
        p_lead_id text,
        p_actor_id text default 'human_operator'
      )
      returns jsonb
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        v_actor text := coalesce(public.revex_actor(), nullif(p_actor_id, ''));
        v_before text;
        v_stage text;
        v_dm boolean;
        v_pain boolean;
        v_fit boolean;
        v_econ boolean;
        v_will boolean;
      begin
        select status, pipeline_stage,
               qual_decision_maker, qual_legitimate_pain, qual_service_fit,
               qual_economic_value, qual_willingness
          into v_before, v_stage, v_dm, v_pain, v_fit, v_econ, v_will
          from public.revenue_leads
         where lead_id = p_lead_id
           and (auth.uid() is null
                or organization_id in (select public.user_organization_ids()));

        if not found then
          raise exception 'unknown lead_id %', p_lead_id using errcode = '42501';
        end if;

        -- Wipe leftover Airtable status strings only. Never qualify. Never move stage.
        update public.revenue_leads
           set status = 'New',
               updated_by = coalesce(v_actor, updated_by),
               updated_at = now()
         where lead_id = p_lead_id;

        return jsonb_build_object(
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
      end;
      $body$
    $fn$;
    revoke all on function public.revex_clear_legacy_status(text,text) from public, anon;
    grant execute on function public.revex_clear_legacy_status(text,text) to authenticated, service_role;
  end if;
end;
$$;

-- Invoker-rights revenue RPCs: nothing for anon (they could only fail under
-- RLS, but they should not be reachable without signing in at all).
do $$
declare
  v_fn regprocedure;
begin
  for v_fn in
    select p.oid::regprocedure
      from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.prokind = 'f'
       and (p.proname like 'revex\_%' or p.proname in ('apply_revenue_control_command', 'create_revenue_lead'))
  loop
    -- Keep the signed-in and service paths explicit before dropping PUBLIC.
    execute format('grant execute on function %s to authenticated, service_role', v_fn);
    execute format('revoke execute on function %s from public, anon', v_fn);
  end loop;
end;
$$;
