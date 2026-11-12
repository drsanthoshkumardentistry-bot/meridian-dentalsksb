# MeriDent Prep

Mobile-first study app for BDS students: university syllabus, high-yield topics, an AI viva voce examiner, a spotter image bank, Leitner flashcards and NEET MDS MCQ mock tests.

**Stack:** React 18 · Vite 5 · Tailwind CSS 3 · Lucide React · Supabase (Postgres, Auth, Storage, Edge Functions)

## Modules

| Module | What it does |
| --- | --- |
| Dashboard | Light/dark clinical theme, cards due, viva average, spotter and MCQ accuracy, next must-know topics |
| A. Syllabus & High-Yield Hub | Topics grouped by subject and tagged **Must-Know** or **Desirable**; structured answers (definition, classification, aetiology, clinical features, investigations, histopathology, management, viva pearls) stored as JSONB |
| B. Viva Voce Simulator | Starts from a clinical vignette or spotter card; a strict examiner asks questions and probes weak answers once; live meters for accuracy, clinical terminology and confidence (flags hedges like "I think"); final verdict out of 10; voice answers through the Web Speech API |
| C. Spotter & Image Bank | Radiographs, H&E slides, instruments and specimens; timed quiz (30/60/90 s), instant key findings and diagnostic pearls; "viva on this spotter" |
| Flashcards | 5-box Leitner system (daily → 1 → 3 → 7 → 14 days); the same logic runs in SQL (`review_flashcard`) and JS |
| NEET MDS MCQs | PYQ / Most Important / subject-wise practice, bookmarks, mistake review, mock tests with +4/−1 marking, question palette and mark-for-review |

## Examiner engines
* **Built-in (default, free, offline):** `src/lib/examiner.js` scores keyword concepts (with synonyms) taken from each topic's `viva` script. Unit-tested.
* **AI (beta):** Supabase Edge Function `viva-examiner`. Set `GEMINI_API_KEY` (Google AI Studio free tier) or `ANTHROPIC_API_KEY` as a function secret. If the call fails, the app switches back to the built-in engine automatically.

## Run locally
```bash
npm install
cp .env.example .env      # leave blank for offline/guest mode
npm run dev
npm test                  # examiner + Leitner unit tests
```

## Database
* `supabase/migrations/20261111000000_academy_schema.sql` creates the tables, RLS policies, the Leitner RPC, a storage bucket and the `my_stats` view.
* `supabase/seed.sql` holds the content. Regenerate it with `npm run seed:sql` after editing `src/data/academy.js`.
* Content tables can be read by anyone and written only by admins (`profiles.is_admin`). Learner tables are owner-only.
* To make yourself an admin: `update profiles set is_admin = true where id = '<your user id>';`

## Spotter images
The bundled images in `public/spotters` are **schematic teaching illustrations** (`npm run spotters` → `scripts/make-spotters.mjs`). Upload real radiographs and slides to the `spotters` storage bucket and set `spotters.image_url` to the public URL.

> Content is for revision. Always cross-check with your prescribed textbooks.
