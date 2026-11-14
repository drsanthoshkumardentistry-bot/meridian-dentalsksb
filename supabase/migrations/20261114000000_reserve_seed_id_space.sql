-- Built-in content uses explicit ids below 100000; user-created flashcards start at 100000,
-- so re-seeding content can never overwrite a student's own cards.
select setval(pg_get_serial_sequence('public.flashcards', 'id'), greatest(100000, (select coalesce(max(id), 0) from public.flashcards)));
