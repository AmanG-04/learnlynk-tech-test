-- LearnLynk Tech Test - Task 2: RLS Policies on leads

alter table public.leads enable row level security;

-- Example helper: assume JWT has tenant_id, user_id, role.
-- You can use: current_setting('request.jwt.claims', true)::jsonb
-- Assumes public.leads.team_id references public.teams for team visibility checks.

-- TODO:
-- - counselors see leads where they are owner_id OR on a team assigned the lead
-- - admins can see all leads within their tenant

create policy leads_select_policy
on public.leads
for select
using (
  tenant_id = (coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'tenant_id')::uuid
  and (
    (coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'role') = 'admin'
    or (
      (coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'role') = 'counselor'
      and (
        owner_id = (coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'user_id')::uuid
        or exists (
          select 1
          from public.user_teams ut
          join public.teams t on t.id = ut.team_id
          where ut.user_id = (coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'user_id')::uuid
            and t.tenant_id = public.leads.tenant_id
            and t.id = public.leads.team_id
        )
      )
    )
  )
);

create policy leads_insert_policy
on public.leads
for insert
with check (
  tenant_id = (coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'tenant_id')::uuid
  and (
    (coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'role') in ('admin', 'counselor')
  )
);
