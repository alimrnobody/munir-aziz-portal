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

alter table public.courses enable row level security;

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
