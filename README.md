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
| University PYQs | Tamil Nadu Dr. MGR University BDS theory papers 2009–2026 (1st & 2nd year so far): every question sorted into 10 / 5 / 2 marks, repeat-ranked **Important** list, full papers by session, high-yield MCQs, done / saved marks synced through `portion_progress` (ids prefixed `pyq:`) |
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

## Python extraction tool (`tools/extractor`)
Turns PDFs into app content: MCQ question papers become question-bank entries, and lecture slides become page-cited chunks for StudySync.

```bash
pip install -r tools/extractor/requirements.txt      # pdfplumber, pypdf (+ pytesseract for scanned pages)

# Question paper → MCQs (inline "Ans: B" or a separate ANSWER KEY section)
npm run extract -- mcq papers/oral-path-2024.pdf --exam "NEET MDS" --pyq --subject "Oral Pathology"
npm run extract -- mcq papers/adc-mock.pdf --exam ADC --merge   # --merge adds them to src/data/imported.js

# Lecture slides → chunks for StudySync (RAG)
npm run extract -- lecture slides/ameloblastoma.pdf --max-words 350

# See the cleaned text of each page
npm run extract -- text slides/ameloblastoma.pdf

npm run test:extract                                  # extractor tests
```

* Understands `1.` / `Q1)` / `Q.1` question numbers; `(a)`, `A.` and `1)` options on one line or several; `Ans:`, `Answer:`, `Correct answer -` and `Key:` answers; `Explanation:`/`Ref:` lines; `Subject:` headers; and end-of-paper answer keys (`1. B  2. C`).
* Running headers, footers, page numbers and bullet glyphs are removed. Pages with no text layer are OCR'd automatically when Tesseract is installed.
* Questions without exactly 4 options or an answer go to `needs_review` in the output JSON, never into the bank. `--merge` skips duplicates (matched by a question fingerprint).
* After merging, run `npm run seed:sql` to push the new questions to Supabase as well.

## University PYQ bank (`tools/pyq`)
Questions live in `src/data/pyq/<subject>.json` (one lazy-loaded chunk per subject); MCQs in `src/data/pyqMcqs.js`; the subject list for all four years in `src/data/pyqSubjects.js`. A subject turns on automatically once its JSON exists.

```bash
# 1. text from each TN MGR paper PDF (all sessions of one subject in one PDF)
mkdir -p /tmp/pyq && pdftotext -layout oral_path_16.pdf /tmp/pyq/opath_16.txt
# 2. map the file prefix to year + subject id(s) in FILES at the top of tools/pyq/parse.py
# 3. parse (keep the old .txt files in the same folder so ids stay stable) and write the app data
python3 tools/pyq/parse.py /tmp/pyq /tmp/pyq.json && python3 tools/pyq/emit.py /tmp/pyq.json src/data/pyq
npm test
```
Question ids are a hash of the normalised question, so saved progress survives re-runs.
