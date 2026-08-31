-- Task 1: Supabase schema + RLS for AION Revenue Conversion Copilot
-- See docs/DATA_MODEL.md

-- ---------------------------------------------------------------------------
-- Extensions & helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- organization_members (tenant membership for RLS)
-- ---------------------------------------------------------------------------

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'rep' check (role in ('rep', 'manager', 'admin')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);
create index organization_members_organization_id_idx on public.organization_members (organization_id);

create or replace function public.user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- business_contexts
-- ---------------------------------------------------------------------------

create table public.business_contexts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  industry text not null,
  services jsonb not null default '[]'::jsonb,
  likely_pains jsonb not null default '[]'::jsonb,
  relevant_offer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_contexts_organization_id_idx on public.business_contexts (organization_id);

create trigger business_contexts_set_updated_at
before update on public.business_contexts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  business_context_id uuid references public.business_contexts (id) on delete set null,
  company_name text not null,
  contact_name text,
  source text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_organization_id_idx on public.leads (organization_id);
create index leads_business_context_id_idx on public.leads (business_context_id);

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- calls
-- ---------------------------------------------------------------------------

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  rep_user_id uuid not null references auth.users (id) on delete restrict,
  phase text not null default 'pre' check (phase in ('pre', 'active', 'post', 'completed')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index calls_lead_id_idx on public.calls (lead_id);
create index calls_rep_user_id_idx on public.calls (rep_user_id);

-- ---------------------------------------------------------------------------
-- call_outcomes
-- ---------------------------------------------------------------------------

create table public.call_outcomes (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references public.calls (id) on delete cascade,
  qualification text not null check (
    qualification in ('unqualified', 'exploring', 'qualified', 'disqualified')
  ),
  pain_points jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  next_action text not null,
  transcript_summary text,
  created_at timestamptz not null default now()
);

create index call_outcomes_call_id_idx on public.call_outcomes (call_id);

-- ---------------------------------------------------------------------------
-- event_log
-- ---------------------------------------------------------------------------

create table public.event_log (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references public.calls (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  event_type text not null check (event_type in ('crm', 'learning')),
  payload jsonb not null default '{}'::jsonb,
  external_id text,
  created_at timestamptz not null default now(),
  check (call_id is not null or lead_id is not null)
);

create index event_log_call_id_idx on public.event_log (call_id);
create index event_log_lead_id_idx on public.event_log (lead_id);
create index event_log_event_type_idx on public.event_log (event_type);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.business_contexts enable row level security;
alter table public.leads enable row level security;
alter table public.calls enable row level security;
alter table public.call_outcomes enable row level security;
alter table public.event_log enable row level security;

-- organizations: members can read their org
create policy "members_select_organizations"
on public.organizations
for select
to authenticated
using (id in (select public.user_organization_ids()));

-- organization_members: users see their own memberships
create policy "users_select_own_memberships"
on public.organization_members
for select
to authenticated
using (user_id = auth.uid());

-- business_contexts
create policy "members_select_business_contexts"
on public.business_contexts
for select
to authenticated
using (organization_id in (select public.user_organization_ids()));

create policy "members_insert_business_contexts"
on public.business_contexts
for insert
to authenticated
with check (organization_id in (select public.user_organization_ids()));

create policy "members_update_business_contexts"
on public.business_contexts
for update
to authenticated
using (organization_id in (select public.user_organization_ids()))
with check (organization_id in (select public.user_organization_ids()));

create policy "members_delete_business_contexts"
on public.business_contexts
for delete
to authenticated
using (organization_id in (select public.user_organization_ids()));

-- leads
create policy "members_select_leads"
on public.leads
for select
to authenticated
using (organization_id in (select public.user_organization_ids()));

create policy "members_insert_leads"
on public.leads
for insert
to authenticated
with check (organization_id in (select public.user_organization_ids()));

create policy "members_update_leads"
on public.leads
for update
to authenticated
using (organization_id in (select public.user_organization_ids()))
with check (organization_id in (select public.user_organization_ids()));

create policy "members_delete_leads"
on public.leads
for delete
to authenticated
using (organization_id in (select public.user_organization_ids()));

-- calls (scoped via lead organization)
create policy "members_select_calls"
on public.calls
for select
to authenticated
using (
  exists (
    select 1
    from public.leads l
    where l.id = calls.lead_id
      and l.organization_id in (select public.user_organization_ids())
  )
);

create policy "members_insert_calls"
on public.calls
for insert
to authenticated
with check (
  rep_user_id = auth.uid()
  and exists (
    select 1
    from public.leads l
    where l.id = calls.lead_id
      and l.organization_id in (select public.user_organization_ids())
  )
);

create policy "members_update_calls"
on public.calls
for update
to authenticated
using (
  exists (
    select 1
    from public.leads l
    where l.id = calls.lead_id
      and l.organization_id in (select public.user_organization_ids())
  )
)
with check (
  exists (
    select 1
    from public.leads l
    where l.id = calls.lead_id
      and l.organization_id in (select public.user_organization_ids())
  )
);

create policy "members_delete_calls"
on public.calls
for delete
to authenticated
using (
  exists (
    select 1
    from public.leads l
    where l.id = calls.lead_id
      and l.organization_id in (select public.user_organization_ids())
  )
);

-- call_outcomes (scoped via call -> lead organization)
create policy "members_select_call_outcomes"
on public.call_outcomes
for select
to authenticated
using (
  exists (
    select 1
    from public.calls c
    join public.leads l on l.id = c.lead_id
    where c.id = call_outcomes.call_id
      and l.organization_id in (select public.user_organization_ids())
  )
);

create policy "members_insert_call_outcomes"
on public.call_outcomes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.calls c
    join public.leads l on l.id = c.lead_id
    where c.id = call_outcomes.call_id
      and l.organization_id in (select public.user_organization_ids())
  )
);

create policy "members_update_call_outcomes"
on public.call_outcomes
for update
to authenticated
using (
  exists (
    select 1
    from public.calls c
    join public.leads l on l.id = c.lead_id
    where c.id = call_outcomes.call_id
      and l.organization_id in (select public.user_organization_ids())
  )
)
with check (
  exists (
    select 1
    from public.calls c
    join public.leads l on l.id = c.lead_id
    where c.id = call_outcomes.call_id
      and l.organization_id in (select public.user_organization_ids())
  )
);

create policy "members_delete_call_outcomes"
on public.call_outcomes
for delete
to authenticated
using (
  exists (
    select 1
    from public.calls c
    join public.leads l on l.id = c.lead_id
    where c.id = call_outcomes.call_id
      and l.organization_id in (select public.user_organization_ids())
  )
);

-- event_log (scoped via lead or call -> lead organization)
create policy "members_select_event_log"
on public.event_log
for select
to authenticated
using (
  (
    lead_id is not null
    and exists (
      select 1
      from public.leads l
      where l.id = event_log.lead_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
  or (
    call_id is not null
    and exists (
      select 1
      from public.calls c
      join public.leads l on l.id = c.lead_id
      where c.id = event_log.call_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
);

create policy "members_insert_event_log"
on public.event_log
for insert
to authenticated
with check (
  (
    lead_id is not null
    and exists (
      select 1
      from public.leads l
      where l.id = event_log.lead_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
  or (
    call_id is not null
    and exists (
      select 1
      from public.calls c
      join public.leads l on l.id = c.lead_id
      where c.id = event_log.call_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
);

create policy "members_update_event_log"
on public.event_log
for update
to authenticated
using (
  (
    lead_id is not null
    and exists (
      select 1
      from public.leads l
      where l.id = event_log.lead_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
  or (
    call_id is not null
    and exists (
      select 1
      from public.calls c
      join public.leads l on l.id = c.lead_id
      where c.id = event_log.call_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
)
with check (
  (
    lead_id is not null
    and exists (
      select 1
      from public.leads l
      where l.id = event_log.lead_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
  or (
    call_id is not null
    and exists (
      select 1
      from public.calls c
      join public.leads l on l.id = c.lead_id
      where c.id = event_log.call_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
);

create policy "members_delete_event_log"
on public.event_log
for delete
to authenticated
using (
  (
    lead_id is not null
    and exists (
      select 1
      from public.leads l
      where l.id = event_log.lead_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
  or (
    call_id is not null
    and exists (
      select 1
      from public.calls c
      join public.leads l on l.id = c.lead_id
      where c.id = event_log.call_id
        and l.organization_id in (select public.user_organization_ids())
    )
  )
);
