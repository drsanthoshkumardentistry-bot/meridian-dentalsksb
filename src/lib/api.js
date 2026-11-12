// Data layer. Two backends behind one interface:
//   • local  – guest mode, progress in localStorage, content from the built-in seed
//   • cloud  – signed-in user, everything in Supabase (RLS keeps rows private)
import { supabase } from './supabase.js'
import { buildLocalContent } from './content.js'

const LS_KEY = 'ma-progress-v1'
export const emptyProgress = () => ({ cards: {}, spotterAttempts: [], vivas: [], answers: {}, bookmarks: [], mocks: [] })

function readLocal() {
  try { return { ...emptyProgress(), ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') } } catch { return emptyProgress() }
}
function writeLocal(p) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch { /* storage full or blocked */ }
}

// ---------------- CONTENT ----------------
export async function loadContent() {
  const local = buildLocalContent()
  if (!supabase) return { ...local, source: 'local' }
  try {
    const [s, t, f, sp, m] = await Promise.all([
      supabase.from('subjects').select('*').order('sort_order'),
      supabase.from('topics').select('*').order('id'),
      supabase.from('flashcards').select('*').order('id'),
      supabase.from('spotters').select('*').order('id'),
      supabase.from('mcq_questions').select('*').order('id'),
    ])
    const err = [s, t, f, sp, m].find((r) => r.error)
    if (err) throw err.error
    if (!t.data.length) return { ...local, source: 'local' }
    return { subjects: s.data, topics: t.data, flashcards: f.data, spotters: sp.data, mcqs: m.data.length ? m.data : local.mcqs, source: 'cloud' }
  } catch (e) {
    console.warn('Falling back to built-in content:', e?.message || e)
    return { ...local, source: 'local' }
  }
}

// ---------------- PROGRESS ----------------
export async function loadProgress(user) {
  if (!user || !supabase) return readLocal()
  const uid = user.id
  const [cards, spot, vivas, ans, bm, mocks] = await Promise.all([
    supabase.from('flashcard_progress').select('*').eq('user_id', uid),
    supabase.from('spotter_attempts').select('spotter_id,correct,time_ms,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(500),
    supabase.from('viva_sessions').select('id,mode,topic_id,spotter_id,engine,overall,scores,feedback,started_at,ended_at,status').eq('user_id', uid).order('started_at', { ascending: false }).limit(100),
    supabase.from('answers').select('question_id,correct').eq('user_id', uid),
    supabase.from('bookmarks').select('question_id').eq('user_id', uid),
    supabase.from('mock_results').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
  ])
  const firstErr = [cards, spot, vivas, ans, bm, mocks].find((r) => r.error)
  if (firstErr) throw firstErr.error
  return {
    cards: Object.fromEntries(cards.data.map((r) => [r.flashcard_id, r])),
    spotterAttempts: spot.data,
    vivas: vivas.data.filter((v) => v.status === 'completed'),
    answers: Object.fromEntries(ans.data.map((r) => [r.question_id, r.correct])),
    bookmarks: bm.data.map((r) => r.question_id),
    mocks: mocks.data.map((r) => ({ ...r, ...(r.details || {}) })),
  }
}

/** Persist one progress action. `next` is the already-updated progress (used by the local backend). */
export async function persist(user, action, next) {
  if (!user || !supabase) { writeLocal(next); return }
  const uid = user.id
  let res
  switch (action.type) {
    case 'card':
      res = await supabase.rpc('review_flashcard', { p_flashcard_id: action.id, p_correct: action.correct })
      break
    case 'spotter':
      res = await supabase.from('spotter_attempts').insert({ user_id: uid, spotter_id: action.attempt.spotter_id, correct: action.attempt.correct, time_ms: action.attempt.time_ms })
      break
    case 'answer':
      res = await supabase.from('answers').upsert({ user_id: uid, question_id: action.qid, correct: action.correct, updated_at: new Date().toISOString() })
      break
    case 'bookmark':
      res = action.on
        ? await supabase.from('bookmarks').upsert({ user_id: uid, question_id: action.qid })
        : await supabase.from('bookmarks').delete().eq('user_id', uid).eq('question_id', action.qid)
      break
    case 'mock': {
      const m = action.result
      res = await supabase.from('mock_results').insert({ user_id: uid, kind: m.kind, score: m.score, max_score: m.max, correct: m.c, wrong: m.w, unattempted: m.u, details: { pct: m.pct, time: m.time, n: m.n } })
      break
    }
    case 'viva': {
      const v = action.viva
      res = await supabase.from('viva_sessions').insert({
        id: v.id, user_id: uid, mode: v.mode, topic_id: v.topic_id, spotter_id: v.spotter_id, engine: v.engine, track: v.track ?? null,
        status: 'completed', scores: v.scores, overall: v.overall, feedback: v.feedback, started_at: v.started_at, ended_at: v.ended_at,
      })
      if (!res.error && v.messages?.length) {
        res = await supabase.from('viva_messages').insert(v.messages.map((m) => ({ session_id: v.id, role: m.role, content: m.content, evaluation: m.evaluation ?? null })))
      }
      break
    }
    case 'reset':
      return
    default:
      return
  }
  if (res?.error) throw res.error
}

// ---------------- PROFILE ----------------
export async function loadProfile(user) {
  if (!user || !supabase) {
    try { return JSON.parse(localStorage.getItem('ma-profile') || 'null') } catch { return null }
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  return data
}

export async function saveProfile(user, patch) {
  if (!user || !supabase) {
    const p = { ...(await loadProfile(null)), ...patch }
    try { localStorage.setItem('ma-profile', JSON.stringify(p)) } catch { /* ignore */ }
    return p
  }
  const { data, error } = await supabase.from('profiles').upsert({ id: user.id, ...patch }).select().single()
  if (error) throw error
  return data
}

// ---------------- AI EXAMINER ----------------
/** Ask the cloud AI examiner. Throws if unavailable so the caller can fall back to the built-in engine. */
export async function askAiExaminer(payload) {
  if (!supabase) throw new Error('offline')
  const { data, error } = await supabase.functions.invoke('viva-examiner', { body: payload })
  if (error) throw error
  if (!data?.reply) throw new Error(data?.error || 'empty reply')
  return data
}
