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

alter table public.profiles enable row level security;

drop policy if exists "profiles owner rows are protected on update" on public.profiles;
create policy "profiles owner rows are protected on update"
on public.profiles
as restrictive
for update
using (
  role <> 'owner' or public.current_profile_role() = 'owner'
)
with check (
  role <> 'owner' or public.current_profile_role() = 'owner'
);

drop policy if exists "profiles owner rows are protected on delete" on public.profiles;
create policy "profiles owner rows are protected on delete"
on public.profiles
as restrictive
for delete
using (
  role <> 'owner' or public.current_profile_role() = 'owner'
);

create or replace function public.protect_owner_profile_mutations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  actor_role := public.current_profile_role();

  if tg_op = 'DELETE' then
    if old.role = 'owner' then
      raise exception 'Owner account cannot be deleted';
    end if;
    return old;
  end if;

  if old.role = 'owner' and new.role is distinct from old.role then
    raise exception 'Owner role cannot be changed';
  end if;

  if old.role = 'owner' and actor_role <> 'owner' then
    raise exception 'Admins cannot modify owner account';
  end if;

  if new.role is distinct from old.role and actor_role <> 'owner' then
    raise exception 'Only owner can change roles';
  end if;

  if new.role = 'owner' and old.role <> 'owner' then
    raise exception 'Owner role cannot be assigned through the admin UI';
  end if;

  if new.role = 'admin' and actor_role <> 'owner' then
    raise exception 'Only owner can promote users to admin';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_owner_profile_mutations on public.profiles;
create trigger protect_owner_profile_mutations
before update or delete on public.profiles
for each row
execute function public.protect_owner_profile_mutations();
