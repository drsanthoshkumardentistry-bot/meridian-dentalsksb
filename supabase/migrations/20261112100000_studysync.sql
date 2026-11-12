-- =====================================================================
-- StudySync (inside MeriDent Prep): courses, documents, page-cited chunks
-- Sprint 1 – upload lecture PDFs, cited summaries, flashcards, slide search
-- =====================================================================
create extension if not exists vector;

create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  subject_id  bigint references public.subjects(id) on delete set null,
  university  text,
  join_code   text unique not null default upper(encode(gen_random_bytes(4), 'hex')),
  created_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.course_members (
  course_id  uuid references public.courses(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner','editor','member')),
  joined_at  timestamptz not null default now(),
  primary key (course_id, user_id)
);
create index if not exists course_members_user_idx on public.course_members (user_id);

create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  uploaded_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null,
  kind         text not null default 'pdf' check (kind in ('pdf','audio','text')),
  storage_path text,
  page_count   int,
  status       text not null default 'uploaded' check (status in ('uploaded','extracting','embedding','ready','failed')),
  error        text,
  summary      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists documents_course_idx on public.documents (course_id, created_at desc);
create index if not exists documents_uploader_idx on public.documents (uploaded_by);

create table if not exists public.document_chunks (
  id          bigint generated always as identity primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  ordinal     int not null,
  page_from   int,
  page_to     int,
  content     text not null,
  token_count int,
  embedding   vector(768)            -- filled later by Meridee AI (Gemini embeddings)
);
create index if not exists document_chunks_doc_idx on public.document_chunks (document_id, ordinal);
create index if not exists document_chunks_course_idx on public.document_chunks (course_id);

-- AI/auto-generated flashcards live in the existing Leitner deck.
alter table public.flashcards add column if not exists course_id   uuid references public.courses(id) on delete cascade;
alter table public.flashcards add column if not exists document_id uuid references public.documents(id) on delete cascade;
alter table public.flashcards add column if not exists page        int;
alter table public.flashcards add column if not exists origin      text not null default 'seed';
alter table public.flashcards drop constraint if exists flashcards_origin_check;
alter table public.flashcards add constraint flashcards_origin_check check (origin in ('seed','auto','ai','user'));
create index if not exists flashcards_course_idx on public.flashcards (course_id);
create index if not exists flashcards_document_idx on public.flashcards (document_id);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.is_course_member(p_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.course_members m where m.course_id = p_course and m.user_id = (select auth.uid()));
$$;
revoke execute on function public.is_course_member(uuid) from public, anon;
grant execute on function public.is_course_member(uuid) to authenticated;

create or replace function public.course_role(p_course uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.course_members m where m.course_id = p_course and m.user_id = (select auth.uid());
$$;
revoke execute on function public.course_role(uuid) from public, anon;
grant execute on function public.course_role(uuid) to authenticated;

-- The creator becomes owner automatically.
create or replace function public.add_course_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.course_members (course_id, user_id, role) values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end; $$;
revoke execute on function public.add_course_owner() from public, anon, authenticated;
drop trigger if exists courses_add_owner on public.courses;
create trigger courses_add_owner after insert on public.courses for each row execute function public.add_course_owner();

-- Join a course with its code (non-members cannot read courses directly).
create or replace function public.join_course(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid;
begin
  if (select auth.uid()) is null then raise exception 'sign in required'; end if;
  select id into cid from public.courses where join_code = upper(trim(p_code));
  if cid is null then raise exception 'invalid join code'; end if;
  insert into public.course_members (course_id, user_id, role) values (cid, (select auth.uid()), 'member')
  on conflict do nothing;
  return cid;
end; $$;
revoke execute on function public.join_course(text) from public, anon;
grant execute on function public.join_course(text) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.courses         enable row level security;
alter table public.course_members  enable row level security;
alter table public.documents       enable row level security;
alter table public.document_chunks enable row level security;

drop policy if exists "courses: members read" on public.courses;
drop policy if exists "courses: create own"   on public.courses;
drop policy if exists "courses: owner edits"  on public.courses;
drop policy if exists "courses: owner deletes" on public.courses;
create policy "courses: members read"  on public.courses for select to authenticated using ((select public.is_course_member(id)) or created_by = (select auth.uid()));
create policy "courses: create own"    on public.courses for insert to authenticated with check (created_by = (select auth.uid()));
create policy "courses: owner edits"   on public.courses for update to authenticated using ((select public.course_role(id)) in ('owner','editor')) with check ((select public.course_role(id)) in ('owner','editor'));
create policy "courses: owner deletes" on public.courses for delete to authenticated using ((select public.course_role(id)) = 'owner');

drop policy if exists "course_members: members read" on public.course_members;
drop policy if exists "course_members: leave"        on public.course_members;
drop policy if exists "course_members: owner manages" on public.course_members;
create policy "course_members: members read"  on public.course_members for select to authenticated using ((select public.is_course_member(course_id)));
create policy "course_members: leave"         on public.course_members for delete to authenticated using (user_id = (select auth.uid()) or (select public.course_role(course_id)) = 'owner');
create policy "course_members: owner manages" on public.course_members for update to authenticated using ((select public.course_role(course_id)) = 'owner') with check ((select public.course_role(course_id)) = 'owner');

drop policy if exists "documents: members read"   on public.documents;
drop policy if exists "documents: members upload" on public.documents;
drop policy if exists "documents: uploader edits" on public.documents;
drop policy if exists "documents: uploader deletes" on public.documents;
create policy "documents: members read"     on public.documents for select to authenticated using ((select public.is_course_member(course_id)));
create policy "documents: members upload"   on public.documents for insert to authenticated with check ((select public.is_course_member(course_id)) and uploaded_by = (select auth.uid()));
create policy "documents: uploader edits"   on public.documents for update to authenticated using (uploaded_by = (select auth.uid()) or (select public.course_role(course_id)) in ('owner','editor')) with check ((select public.is_course_member(course_id)));
create policy "documents: uploader deletes" on public.documents for delete to authenticated using (uploaded_by = (select auth.uid()) or (select public.course_role(course_id)) = 'owner');

drop policy if exists "chunks: members read"   on public.document_chunks;
drop policy if exists "chunks: uploader writes" on public.document_chunks;
create policy "chunks: members read"    on public.document_chunks for select to authenticated using ((select public.is_course_member(course_id)));
create policy "chunks: uploader writes" on public.document_chunks for all to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id and d.uploaded_by = (select auth.uid())))
  with check (exists (select 1 from public.documents d where d.id = document_id and d.uploaded_by = (select auth.uid()) and d.course_id = document_chunks.course_id));

-- Flashcards: course cards are visible to course members.
drop policy if exists "flashcards: read" on public.flashcards;
create policy "flashcards: read" on public.flashcards for select to anon, authenticated
  using (created_by is null or created_by = (select auth.uid()) or (course_id is not null and (select public.is_course_member(course_id))));
drop policy if exists "flashcards: insert own" on public.flashcards;
create policy "flashcards: insert own" on public.flashcards for insert to authenticated
  with check ((created_by = (select auth.uid()) and (course_id is null or (select public.is_course_member(course_id))))
              or (created_by is null and (select public.is_admin())));

-- ---------------------------------------------------------------------
-- Storage: private bucket, path = {course_id}/{document_id}.pdf
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-files', 'course-files', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "course-files: members read" on storage.objects;
drop policy if exists "course-files: members upload" on storage.objects;
drop policy if exists "course-files: uploader deletes" on storage.objects;
create policy "course-files: members read" on storage.objects for select to authenticated
  using (bucket_id = 'course-files' and (select public.is_course_member(((storage.foldername(name))[1])::uuid)));
create policy "course-files: members upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'course-files' and (select public.is_course_member(((storage.foldername(name))[1])::uuid)));
create policy "course-files: uploader deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'course-files' and owner = (select auth.uid()));
