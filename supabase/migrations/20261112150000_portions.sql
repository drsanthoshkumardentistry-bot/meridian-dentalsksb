-- Syllabus portions tracker: one row per user per chapter (status 0..3 = not started, read, revised, confident)
create table if not exists public.portion_progress (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chapter_id text not null check (char_length(chapter_id) <= 120),
  status     smallint not null default 0 check (status between 0 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);
alter table public.portion_progress enable row level security;
drop policy if exists "portion_progress: own rows" on public.portion_progress;
create policy "portion_progress: own rows" on public.portion_progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
