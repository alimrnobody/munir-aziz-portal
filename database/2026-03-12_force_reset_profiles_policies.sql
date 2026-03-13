alter table public.profiles enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_record.policyname);
  end loop;
end;
$$;

create policy "profiles users read own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles users update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
