-- Refactor: remove phases and link lessons directly to courses.
-- Run this in Supabase SQL editor.

alter table public.lessons
  add column if not exists course_id uuid;

-- Backfill lessons.course_id from phases before dropping phase references.
update public.lessons l
set course_id = p.course_id
from public.phases p
where l.phase_id = p.id
  and l.course_id is null;

alter table public.lessons
  add column if not exists order_index integer not null default 1,
  add column if not exists is_locked boolean not null default false,
  add column if not exists video_url text not null default '';

alter table public.lessons
  alter column course_id set not null;

alter table public.lessons
  add constraint lessons_course_id_fkey
  foreign key (course_id) references public.courses(id) on delete cascade;

drop index if exists lessons_phase_id_idx;
create index if not exists lessons_course_id_idx on public.lessons(course_id);

alter table public.lessons
  drop column if exists phase_id;

drop table if exists public.phases cascade;
