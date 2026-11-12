-- MeriDent Prep: preparation tracks (University / NEET MDS / ADC) + ADC question bank
alter table public.profiles drop constraint if exists profiles_target_exam_check;
alter table public.profiles add constraint profiles_target_exam_check
  check (target_exam in ('University','NEET MDS','ADC','INBDE','ORE','Other'));

alter table public.mcq_questions add column if not exists exam text not null default 'NEET MDS';
alter table public.mcq_questions drop constraint if exists mcq_questions_exam_check;
alter table public.mcq_questions add constraint mcq_questions_exam_check check (exam in ('NEET MDS','ADC'));
create index if not exists mcq_questions_exam_idx on public.mcq_questions (exam);

alter table public.subjects add column if not exists track text;
alter table public.subjects drop constraint if exists subjects_track_check;
alter table public.subjects add constraint subjects_track_check check (track is null or track in ('adc'));

alter table public.viva_sessions add column if not exists track text;
