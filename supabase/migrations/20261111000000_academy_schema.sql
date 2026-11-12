-- =====================================================================
-- MeriDent Academy (DentViva) — core schema
-- Supabase / PostgreSQL 15+
--
-- Content tables (subjects, topics, flashcards, spotters, mcq_questions)
--   → readable by everyone, writable only by admins (profiles.is_admin).
-- Learner tables (profiles, flashcard_progress, spotter_attempts,
--   viva_sessions, viva_messages, answers, bookmarks, mock_results)
--   → each user can only see and change their own rows.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  bds_year     smallint check (bds_year between 1 and 5),   -- 5 = intern / CRRI
  university   text,
  college      text,
  target_exam  text default 'University' check (target_exam in ('University','NEET MDS','INBDE','ORE','Other')),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Create a profile row automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by admin-only policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Stop users from making themselves admin.
create or replace function public.protect_admin_flag()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end; $$;

drop trigger if exists profiles_protect_admin on public.profiles;
create trigger profiles_protect_admin before update on public.profiles
  for each row execute function public.protect_admin_flag();

-- ---------------------------------------------------------------------
-- 2. SUBJECTS & TOPICS (University syllabus + high-yield hub)
-- ---------------------------------------------------------------------
create table if not exists public.subjects (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  bds_year    smallint check (bds_year between 1 and 5),
  icon        text,                 -- lucide icon name
  color       text,                 -- tailwind colour key, e.g. 'sky'
  sort_order  int not null default 0
);

create table if not exists public.topics (
  id          bigint generated always as identity primary key,
  subject_id  bigint not null references public.subjects (id) on delete cascade,
  slug        text not null unique,
  title       text not null,
  priority    text not null default 'must_know' check (priority in ('must_know','desirable')),
  marks_hint  text,                 -- e.g. '10 marks essay', '5 marks short note'
  /* content shape:
     {
       "definition": "…",
       "classification": ["…"],
       "etiology": ["…"],
       "clinical_features": ["…"],
       "investigations": ["…"],
       "histopathology": ["…"],
       "management": ["…"],
       "viva_pearls": ["…"]
     } */
  content     jsonb not null default '{}'::jsonb,
  /* viva script for the examiner:
     [{ "q": "Define …", "keywords": ["term|synonym", …], "probe": "follow-up if weak" }] */
  viva        jsonb not null default '[]'::jsonb,
  vignette    text,                 -- clinical case stem shown at the top of a viva
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  constraint topics_content_is_object check (jsonb_typeof(content) = 'object'),
  constraint topics_viva_is_array     check (jsonb_typeof(viva) = 'array')
);
create index if not exists topics_subject_idx  on public.topics (subject_id);
create index if not exists topics_priority_idx on public.topics (priority);
create index if not exists topics_content_gin  on public.topics using gin (content jsonb_path_ops);

-- ---------------------------------------------------------------------
-- 3. FLASHCARDS + LEITNER SPACED REPETITION
-- ---------------------------------------------------------------------
create table if not exists public.flashcards (
  id          bigint generated always as identity primary key,
  topic_id    bigint references public.topics (id) on delete cascade,
  front       text not null,
  back        text not null,
  created_by  uuid references auth.users (id) on delete cascade,  -- null = global deck
  created_at  timestamptz not null default now()
);
create index if not exists flashcards_topic_idx   on public.flashcards (topic_id);
create index if not exists flashcards_creator_idx on public.flashcards (created_by);

-- Per-user Leitner state. Box 1 = review daily … box 5 = every 14 days.
create table if not exists public.flashcard_progress (
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  flashcard_id     bigint not null references public.flashcards (id) on delete cascade,
  box              smallint not null default 1 check (box between 1 and 5),
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz,
  review_count     int not null default 0,
  lapse_count      int not null default 0,
  primary key (user_id, flashcard_id)
);
create index if not exists flashcard_progress_due_idx on public.flashcard_progress (user_id, due_at);
create index if not exists flashcard_progress_card_idx on public.flashcard_progress (flashcard_id);

-- Server-side Leitner step (keeps intervals consistent across devices).
create or replace function public.review_flashcard(p_flashcard_id bigint, p_correct boolean)
returns public.flashcard_progress
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cur  public.flashcard_progress;
  nb   smallint;
  days int[] := array[0, 1, 3, 7, 14];   -- interval in days for boxes 1..5
begin
  select * into cur from public.flashcard_progress
   where user_id = (select auth.uid()) and flashcard_id = p_flashcard_id;

  nb := case when p_correct then least(coalesce(cur.box, 1) + 1, 5) else 1 end;

  insert into public.flashcard_progress as fp
    (user_id, flashcard_id, box, due_at, last_reviewed_at, review_count, lapse_count)
  values ((select auth.uid()), p_flashcard_id, nb,
          now() + make_interval(days => days[nb]), now(), 1, case when p_correct then 0 else 1 end)
  on conflict (user_id, flashcard_id) do update
    set box = excluded.box,
        due_at = excluded.due_at,
        last_reviewed_at = now(),
        review_count = fp.review_count + 1,
        lapse_count  = fp.lapse_count + case when p_correct then 0 else 1 end
  returning * into cur;
  return cur;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. SPOTTERS (radiographs, histology, instruments, specimens)
-- ---------------------------------------------------------------------
create table if not exists public.spotters (
  id               bigint generated always as identity primary key,
  subject_id       bigint references public.subjects (id) on delete set null,
  topic_id         bigint references public.topics (id) on delete set null,
  category         text not null check (category in ('radiograph','histology','instrument','specimen')),
  title            text not null,       -- correct answer / diagnosis
  image_url        text not null,       -- Storage URL or /spotters/*.svg
  image_credit     text,
  stain            text,                -- e.g. 'H&E, 40x' for histology
  key_findings     text[] not null default '{}',
  differentials    text[] not null default '{}',
  distractors      text[] not null default '{}',  -- wrong options for MCQ mode
  diagnostic_pearl text,
  uses             text[] not null default '{}',  -- for instruments
  difficulty       smallint not null default 2 check (difficulty between 1 and 3),
  created_at       timestamptz not null default now()
);
create index if not exists spotters_category_idx on public.spotters (category);
create index if not exists spotters_subject_idx  on public.spotters (subject_id);
create index if not exists spotters_topic_idx    on public.spotters (topic_id);

create table if not exists public.spotter_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  spotter_id  bigint not null references public.spotters (id) on delete cascade,
  correct     boolean not null,
  time_ms     int check (time_ms >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists spotter_attempts_user_idx    on public.spotter_attempts (user_id, created_at desc);
create index if not exists spotter_attempts_spotter_idx on public.spotter_attempts (spotter_id);

-- ---------------------------------------------------------------------
-- 5. VIVA VOCE SESSIONS (AI external examiner)
-- ---------------------------------------------------------------------
create table if not exists public.viva_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode         text not null default 'topic' check (mode in ('topic','spotter')),
  topic_id     bigint references public.topics (id) on delete set null,
  spotter_id   bigint references public.spotters (id) on delete set null,
  engine       text not null default 'local' check (engine in ('local','ai')),
  status       text not null default 'active' check (status in ('active','completed','abandoned')),
  /* {"terminology":0-100,"accuracy":0-100,"confidence":0-100,"overall":0-10} */
  scores       jsonb not null default '{}'::jsonb,
  overall      numeric(4,1) check (overall between 0 and 10),
  feedback     text,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz
);
create index if not exists viva_sessions_user_idx    on public.viva_sessions (user_id, started_at desc);
create index if not exists viva_sessions_topic_idx   on public.viva_sessions (topic_id);
create index if not exists viva_sessions_spotter_idx on public.viva_sessions (spotter_id);

create table if not exists public.viva_messages (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references public.viva_sessions (id) on delete cascade,
  role        text not null check (role in ('examiner','student','system')),
  content     text not null,
  /* for student turns:
     {"score":0-10,"terminology":0-100,"accuracy":0-100,"confidence":0-100,
      "hits":["…"],"missed":["…"],"hedges":["…"],"feedback":"…"} */
  evaluation  jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists viva_messages_session_idx on public.viva_messages (session_id, id);

-- ---------------------------------------------------------------------
-- 6. NEET MDS MCQ BANK (PYQ / Most Important / Mock tests)
--    answers, bookmarks and mock_results already exist in this project;
--    they are created here too so a fresh project gets everything.
-- ---------------------------------------------------------------------
create table if not exists public.mcq_questions (
  id          int primary key,
  subject     text not null,
  question    text not null,
  options     text[] not null check (array_length(options, 1) = 4),
  answer      smallint not null check (answer between 0 and 3),
  explanation text,
  is_pyq      boolean not null default false,
  is_important boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.answers (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id int not null,
  correct     boolean not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table if not exists public.bookmarks (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id int not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table if not exists public.mock_results (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text,
  score       int,
  max_score   int,
  correct     int,
  wrong       int,
  unattempted int,
  created_at  timestamptz not null default now()
);
-- Widen the original A/B/ALL check so PYQ / IMP / subject tests can be stored.
alter table public.mock_results drop constraint if exists mock_results_kind_check;
alter table public.mock_results add  column if not exists details jsonb not null default '{}'::jsonb;
create index if not exists mock_results_user_idx on public.mock_results (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.subjects           enable row level security;
alter table public.topics             enable row level security;
alter table public.flashcards         enable row level security;
alter table public.flashcard_progress enable row level security;
alter table public.spotters           enable row level security;
alter table public.spotter_attempts   enable row level security;
alter table public.viva_sessions      enable row level security;
alter table public.viva_messages      enable row level security;
alter table public.mcq_questions      enable row level security;
alter table public.answers            enable row level security;
alter table public.bookmarks          enable row level security;
alter table public.mock_results       enable row level security;

-- profiles: own row only
drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: read own"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles: insert own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- content: public read, admin write
do $$
declare t text;
begin
  foreach t in array array['subjects','topics','spotters','mcq_questions'] loop
    execute format('drop policy if exists "%1$s: public read" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: admin write" on public.%1$I', t);
    execute format('create policy "%1$s: public read" on public.%1$I for select to anon, authenticated using (true)', t);
    execute format('create policy "%1$s: admin write" on public.%1$I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end $$;

-- flashcards: global deck readable by all; personal cards by owner
drop policy if exists "flashcards: read"         on public.flashcards;
drop policy if exists "flashcards: insert own"   on public.flashcards;
drop policy if exists "flashcards: modify own"   on public.flashcards;
drop policy if exists "flashcards: delete own"   on public.flashcards;
create policy "flashcards: read" on public.flashcards for select to anon, authenticated
  using (created_by is null or created_by = (select auth.uid()));
create policy "flashcards: insert own" on public.flashcards for insert to authenticated
  with check (created_by = (select auth.uid()) or (created_by is null and (select public.is_admin())));
create policy "flashcards: modify own" on public.flashcards for update to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()))
  with check (created_by = (select auth.uid()) or (select public.is_admin()));
create policy "flashcards: delete own" on public.flashcards for delete to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));

-- learner-owned tables: full CRUD on own rows only
do $$
declare t text;
begin
  foreach t in array array['flashcard_progress','spotter_attempts','viva_sessions','answers','bookmarks','mock_results'] loop
    execute format('drop policy if exists "%1$s: own rows" on public.%1$I', t);
    execute format('create policy "%1$s: own rows" on public.%1$I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- viva_messages: through the parent session
drop policy if exists "viva_messages: own session" on public.viva_messages;
create policy "viva_messages: own session" on public.viva_messages for all to authenticated
  using (exists (select 1 from public.viva_sessions s where s.id = session_id and s.user_id = (select auth.uid())))
  with check (exists (select 1 from public.viva_sessions s where s.id = session_id and s.user_id = (select auth.uid())));

-- ---------------------------------------------------------------------
-- 8. STORAGE bucket for real spotter images (public read, admin upload)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('spotters', 'spotters', true)
on conflict (id) do nothing;

drop policy if exists "spotters bucket: admin upload" on storage.objects;
create policy "spotters bucket: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'spotters' and (select public.is_admin()));
drop policy if exists "spotters bucket: admin modify" on storage.objects;
create policy "spotters bucket: admin modify" on storage.objects for update to authenticated
  using (bucket_id = 'spotters' and (select public.is_admin()));
drop policy if exists "spotters bucket: admin delete" on storage.objects;
create policy "spotters bucket: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'spotters' and (select public.is_admin()));

-- ---------------------------------------------------------------------
-- 9. Handy view: per-user dashboard stats
-- ---------------------------------------------------------------------
create or replace view public.my_stats
with (security_invoker = true) as
select
  (select count(*) from public.flashcard_progress fp where fp.user_id = (select auth.uid()) and fp.due_at <= now()) as cards_due,
  (select count(*) from public.flashcard_progress fp where fp.user_id = (select auth.uid()) and fp.box = 5)          as cards_mastered,
  (select round(avg(case when a.correct then 100 else 0 end)) from public.spotter_attempts a where a.user_id = (select auth.uid())) as spotter_accuracy,
  (select round(avg(v.overall), 1) from public.viva_sessions v where v.user_id = (select auth.uid()) and v.status = 'completed') as viva_average,
  (select round(avg(case when a.correct then 100 else 0 end)) from public.answers a where a.user_id = (select auth.uid())) as mcq_accuracy;

-- ---------------------------------------------------------------------
-- 10. Lock down SECURITY DEFINER helpers (Supabase advisor 0028/0029)
-- ---------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
