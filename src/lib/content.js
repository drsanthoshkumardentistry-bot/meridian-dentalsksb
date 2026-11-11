// Turns the seed data into normalised rows with stable ids.
// The same ids are written into supabase/seed.sql, so local and cloud content line up.
import { SUBJECTS, TOPICS, SPOTTERS } from '../data/academy.js'
import { MCQS } from '../data/mcq.js'

export function buildLocalContent() {
  const subjects = SUBJECTS.map((s, i) => ({ id: i + 1, ...s }))
  const sid = Object.fromEntries(subjects.map((s) => [s.slug, s.id]))
  const topics = TOPICS.map((t, i) => ({
    id: i + 1, subject_id: sid[t.subject], slug: t.slug, title: t.title, priority: t.priority,
    marks_hint: t.marks_hint, content: t.content, viva: t.viva, vignette: t.vignette, tags: t.tags || [],
  }))
  const tid = Object.fromEntries(topics.map((t) => [t.slug, t.id]))
  let fid = 0
  const flashcards = TOPICS.flatMap((t) => (t.flashcards || []).map(([front, back]) => ({ id: ++fid, topic_id: tid[t.slug], front, back, created_by: null })))
  const spotters = SPOTTERS.map((s, i) => ({
    id: i + 1, subject_id: sid[s.subject] ?? null, topic_id: s.topic ? tid[s.topic] : null,
    category: s.category, title: s.title, image_url: s.image_url, stain: s.stain ?? null,
    key_findings: s.key_findings, differentials: s.differentials, distractors: s.distractors,
    diagnostic_pearl: s.diagnostic_pearl, uses: s.uses || [], difficulty: s.difficulty,
  }))
  const mcqs = MCQS.map((q) => ({ ...q }))
  return { subjects, topics, flashcards, spotters, mcqs }
}
