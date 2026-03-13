alter table public.profiles enable row level security;

drop policy if exists "profiles admin owner full access" on public.profiles;
drop policy if exists "profiles users read own profile" on public.profiles;
drop policy if exists "profiles users update own profile" on public.profiles;
drop policy if exists "profiles owner rows are protected on update" on public.profiles;
drop policy if exists "profiles owner rows are protected on delete" on public.profiles;

create policy "profiles users read own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles users update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
