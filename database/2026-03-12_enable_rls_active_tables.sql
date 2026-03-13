create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.is_admin_or_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() in ('admin', 'owner'), false)
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.progress enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_courses enable row level security;

drop policy if exists "profiles admin owner full access" on public.profiles;
create policy "profiles admin owner full access"
on public.profiles
for all
using (public.is_admin_or_owner())
with check (public.is_admin_or_owner());

drop policy if exists "profiles users read own profile" on public.profiles;
create policy "profiles users read own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles users update own profile" on public.profiles;
create policy "profiles users update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "courses admin owner full access" on public.courses;
create policy "courses admin owner full access"
on public.courses
for all
using (public.is_admin_or_owner())
with check (public.is_admin_or_owner());

drop policy if exists "courses authenticated read access" on public.courses;
create policy "courses authenticated read access"
on public.courses
for select
using (auth.role() = 'authenticated');

drop policy if exists "lessons admin owner full access" on public.lessons;
create policy "lessons admin owner full access"
on public.lessons
for all
using (public.is_admin_or_owner())
with check (public.is_admin_or_owner());

drop policy if exists "lessons authenticated read access" on public.lessons;
create policy "lessons authenticated read access"
on public.lessons
for select
using (auth.role() = 'authenticated');

drop policy if exists "progress admin owner full access" on public.progress;
create policy "progress admin owner full access"
on public.progress
for all
using (public.is_admin_or_owner())
with check (public.is_admin_or_owner());

drop policy if exists "progress users manage own records" on public.progress;
create policy "progress users manage own records"
on public.progress
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "teams admin owner full access" on public.teams;
create policy "teams admin owner full access"
on public.teams
for all
using (public.is_admin_or_owner())
with check (public.is_admin_or_owner());

drop policy if exists "team_members admin owner full access" on public.team_members;
create policy "team_members admin owner full access"
on public.team_members
for all
using (public.is_admin_or_owner())
with check (public.is_admin_or_owner());

drop policy if exists "team_members users read own memberships" on public.team_members;
create policy "team_members users read own memberships"
on public.team_members
for select
using (auth.uid() = user_id);

drop policy if exists "team_courses admin owner full access" on public.team_courses;
create policy "team_courses admin owner full access"
on public.team_courses
for all
using (public.is_admin_or_owner())
with check (public.is_admin_or_owner());

drop policy if exists "team_courses authenticated read access" on public.team_courses;
create policy "team_courses authenticated read access"
on public.team_courses
for select
using (auth.role() = 'authenticated');
