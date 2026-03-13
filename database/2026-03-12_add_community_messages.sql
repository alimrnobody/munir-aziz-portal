create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists community_messages_created_at_idx
  on public.community_messages (created_at asc);

create index if not exists community_messages_user_id_idx
  on public.community_messages (user_id);

alter table public.community_messages enable row level security;

DROP POLICY IF EXISTS "authenticated users can read community messages" ON public.community_messages;
DROP POLICY IF EXISTS "users can insert own community messages" ON public.community_messages;
DROP POLICY IF EXISTS "users can update own community messages" ON public.community_messages;
DROP POLICY IF EXISTS "users can delete own community messages" ON public.community_messages;

create policy "authenticated users can read community messages"
  on public.community_messages
  for select
  to authenticated
  using (true);

create policy "users can insert own community messages"
  on public.community_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update own community messages"
  on public.community_messages
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own community messages"
  on public.community_messages
  for delete
  to authenticated
  using (auth.uid() = user_id);

do $$
begin
  begin
    alter publication supabase_realtime add table public.community_messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
