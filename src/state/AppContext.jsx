import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { emptyProgress, loadContent, loadProfile, loadProgress, persist, saveProfile } from '../lib/api.js'
import { nextState } from '../lib/leitner.js'
import { trackOf } from '../lib/tracks.js'
import { addCards, localCards } from '../lib/studyApi.js'

const Ctx = createContext(null)

const initial = {
  ready: false, user: null, profile: null, content: null, progress: emptyProgress(),
  theme: (() => { try { return document.documentElement.classList.contains('dark') ? 'dark' : 'light' } catch { return 'light' } })(),
  notice: null,
}

// Pure reducer for progress changes, so the same transition runs for guest and cloud users.
export function progressReducer(p, a) {
  switch (a.type) {
    case 'card': return { ...p, cards: { ...p.cards, [a.id]: { flashcard_id: a.id, ...nextState(p.cards[a.id], a.correct, a.now) } } }
    case 'spotter': return { ...p, spotterAttempts: [a.attempt, ...p.spotterAttempts].slice(0, 500) }
    case 'answer': return { ...p, answers: { ...p.answers, [a.qid]: a.correct } }
    case 'bookmark': return { ...p, bookmarks: a.on ? [...new Set([...p.bookmarks, a.qid])] : p.bookmarks.filter((x) => x !== a.qid) }
    case 'mock': return { ...p, mocks: [a.result, ...p.mocks].slice(0, 50) }
    case 'viva': { const { messages, ...v } = a.viva; return { ...p, vivas: [v, ...p.vivas].slice(0, 100) } }
    case 'portion': return { ...p, portions: { ...(p.portions || {}), [a.id]: a.status } }
    case 'reset': return emptyProgress()
    default: return p
  }
}

function reducer(s, a) {
  switch (a.type) {
    case 'boot': return { ...s, ...a.payload, ready: true }
    case 'user': return { ...s, user: a.user, profile: a.profile, progress: a.progress, content: a.content || s.content }
    case 'cards': return { ...s, content: { ...s.content, flashcards: [...s.content.flashcards, ...a.cards] } }
    case 'profile': return { ...s, profile: a.profile }
    case 'theme': return { ...s, theme: a.theme }
    case 'notice': return { ...s, notice: a.notice }
    case 'progress': return { ...s, progress: a.progress }
    default: return s
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial)
  // Refs are the source of truth for persistence (avoid stale closures / double-apply).
  const progressRef = useRef(initial.progress)
  const userRef = useRef(null)

  const toast = useCallback((msg, kind = 'info') => {
    dispatch({ type: 'notice', notice: { msg, kind, id: Date.now() } })
    setTimeout(() => dispatch({ type: 'notice', notice: null }), 3200)
  }, [])

  // Boot: content + session + progress.
  useEffect(() => {
    let alive = true
    ;(async () => {
      let user = null
      if (supabase) user = (await supabase.auth.getSession()).data.session?.user ?? null
      const content = withLocalCards(await loadContent(), user)
      const [profile, progress] = await Promise.all([
        loadProfile(user).catch(() => null),
        loadProgress(user).catch(() => emptyProgress()),
      ])
      progressRef.current = progress; userRef.current = user
      if (alive) dispatch({ type: 'boot', payload: { content, user, profile, progress } })
    })()
    if (!supabase) return () => { alive = false }
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return
      const user = session?.user ?? null
      const [profile, progress, content] = await Promise.all([loadProfile(user).catch(() => null), loadProgress(user).catch(() => emptyProgress()), loadContent()])
      progressRef.current = progress; userRef.current = user
      dispatch({ type: 'user', user, profile, progress, content: withLocalCards(content, user) })
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
    try { localStorage.setItem('ma-theme', state.theme) } catch { /* ignore */ }
  }, [state.theme])

  // Apply a progress action optimistically, then persist it.
  const act = useCallback((action) => {
    const stamped = { now: Date.now(), ...action }
    const next = progressReducer(progressRef.current, stamped)
    progressRef.current = next
    dispatch({ type: 'progress', progress: next })
    persist(userRef.current, stamped, next).catch((e) => toast(`Couldn't sync: ${e.message || e}`, 'error'))
  }, [toast])

  const api = useMemo(() => ({
    ...state,
    toast,
    setTheme: (theme) => dispatch({ type: 'theme', theme }),
    reviewCard: (id, correct) => act({ type: 'card', id, correct }),
    recordSpotter: (attempt) => act({ type: 'spotter', attempt: { created_at: new Date().toISOString(), ...attempt } }),
    answerMcq: (qid, correct) => act({ type: 'answer', qid, correct }),
    toggleBookmark: (qid) => act({ type: 'bookmark', qid, on: !state.progress.bookmarks.includes(qid) }),
    saveMock: (result) => act({ type: 'mock', result }),
    saveViva: (viva) => act({ type: 'viva', viva }),
    setPortion: (id, status) => act({ type: 'portion', id, status }),
    resetProgress: () => act({ type: 'reset' }),
    track: trackOf(state.profile),
    /** Save approved StudySync cards into the Leitner deck. */
    addFlashcards: async (cards) => {
      const saved = await addCards(state.user, cards)
      dispatch({ type: 'cards', cards: saved })
      return saved
    },
    setTrack: async (key) => {
      const profile = await saveProfile(state.user, { target_exam: key })
      dispatch({ type: 'profile', profile })
    },
    updateProfile: async (patch) => {
      const profile = await saveProfile(state.user, patch)
      dispatch({ type: 'profile', profile })
      return profile
    },
    signOut: async () => { if (supabase) await supabase.auth.signOut() },
  }), [state, toast, act])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export const useApp = () => useContext(Ctx)

// Guests keep their StudySync cards on this device; add them to the deck.
function withLocalCards(content, user) {
  if (user) return content
  return { ...content, flashcards: [...content.flashcards, ...localCards()] }
}
