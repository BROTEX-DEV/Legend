-- BLACKSITE v1.0.0 schema. Review target project before running.
-- Creates new tables only; no existing tables are dropped.
create table if not exists public.members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.case_files (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 body text not null default '',
 classification text not null default 'RESTRICTED',
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id) on delete set null,
 event_type text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.members enable row level security;
alter table public.case_files enable row level security;
alter table public.audit_logs enable row level security;
drop policy if exists "members_read_self" on public.members;
create policy "members_read_self" on public.members for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "members_read_cases" on public.case_files;
create policy "members_read_cases" on public.case_files for select to authenticated using (exists(select 1 from public.members m where m.user_id=(select auth.uid())));
drop policy if exists "members_create_cases" on public.case_files;
create policy "members_create_cases" on public.case_files for insert to authenticated with check (exists(select 1 from public.members m where m.user_id=(select auth.uid())) and created_by=(select auth.uid()));
drop policy if exists "members_read_own_audit" on public.audit_logs;
create policy "members_read_own_audit" on public.audit_logs for select to authenticated using (actor_id=(select auth.uid()));
grant select on public.members to authenticated;
grant select,insert on public.case_files to authenticated;
grant select on public.audit_logs to authenticated;
-- After creating exactly two Auth users, insert their verified UUIDs:
-- insert into public.members(user_id,display_name) values
-- ('FIRST-AUTH-USER-UUID','OPERATIVE-01'),('SECOND-AUTH-USER-UUID','OPERATIVE-02');
-- Never put service_role or secret keys in browser files.