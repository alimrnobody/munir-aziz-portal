alter table public.progress
add column if not exists created_at timestamptz not null default now();

update public.progress
set created_at = now()
where created_at is null;
