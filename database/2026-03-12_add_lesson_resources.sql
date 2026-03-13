create table if not exists public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create index if not exists lesson_resources_lesson_id_idx
on public.lesson_resources(lesson_id);

insert into storage.buckets (id, name, public)
values ('lesson-resources', 'lesson-resources', true)
on conflict (id) do nothing;

drop policy if exists "lesson resources authenticated read" on storage.objects;
create policy "lesson resources authenticated read"
on storage.objects
for select
using (bucket_id = 'lesson-resources' and auth.role() = 'authenticated');

drop policy if exists "lesson resources authenticated upload" on storage.objects;
create policy "lesson resources authenticated upload"
on storage.objects
for insert
with check (bucket_id = 'lesson-resources' and auth.role() = 'authenticated');

drop policy if exists "lesson resources authenticated update" on storage.objects;
create policy "lesson resources authenticated update"
on storage.objects
for update
using (bucket_id = 'lesson-resources' and auth.role() = 'authenticated')
with check (bucket_id = 'lesson-resources' and auth.role() = 'authenticated');

drop policy if exists "lesson resources authenticated delete" on storage.objects;
create policy "lesson resources authenticated delete"
on storage.objects
for delete
using (bucket_id = 'lesson-resources' and auth.role() = 'authenticated');
